import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createLogger } from './logger.js';
import { monitor } from './monitor.js';

dotenv.config();

const logger = createLogger('LLM');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Retry with exponential backoff
async function retryWithBackoff(fn, config, context = '') {
  const { maxAttempts, baseDelayMs, maxDelayMs } = config.retryConfig;
  let lastError;
  
  await logger.debug(`Starting API call for: ${context}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      if (attempt > 1) {
        await logger.info(`Retry successful for ${context} on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      await logger.warn(`API attempt ${attempt}/${maxAttempts} failed for ${context}`, {
        error: error.message,
        statusCode: error.status,
        type: error.type
      });
      console.error(`Attempt ${attempt} failed for ${context}:`, error.message);
      
      // Track specific error types
      if (error.status === 429) {
        monitor.trackRateLimitHit();
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        monitor.trackTimeout();
      }
      
      if (attempt === maxAttempts) {
        break;
      }
      
      // Calculate delay with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000,
        maxDelayMs
      );
      
      await logger.debug(`Waiting ${delay}ms before retry...`);
      monitor.incrementRetry();
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  await logger.error(`API call failed after ${maxAttempts} attempts: ${context}`, lastError);
  throw new Error(`Failed after ${maxAttempts} attempts: ${lastError.message}`);
}

// Generate completion with retry
export async function generateCompletion(prompt, config, context = '') {
  return await retryWithBackoff(async () => {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates word associations for a semantic graph. Always respond with the exact format requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    
    const content = response.choices[0].message.content.trim();
    
    // Log successful API call
    await logger.logAPICall(
      'chat.completions',
      prompt,
      content
    );
    
    console.log(`API Response for ${context}:`, content);
    return content;
  }, config, context);
}

// Generate embeddings with batching
export async function generateEmbeddings(texts, config) {
  const { batchSize } = config;
  const embeddings = [];
  
  await logger.info(`Generating embeddings for ${texts.length} texts in batches of ${batchSize.embeddings}`);
  
  for (let i = 0; i < texts.length; i += batchSize.embeddings) {
    const batch = texts.slice(i, i + batchSize.embeddings);
    const batchNum = Math.floor(i / batchSize.embeddings) + 1;
    const totalBatches = Math.ceil(texts.length / batchSize.embeddings);
    
    await logger.debug(`Processing embedding batch ${batchNum}/${totalBatches}`);
    
    const response = await retryWithBackoff(async () => {
      return await openai.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
        input: batch,
      });
    }, config, `embeddings batch ${batchNum}`);
    
    embeddings.push(...response.data.map(d => d.embedding));
    
    // Track API usage
    monitor.incrementAPICall(batch.length * 10); // Rough estimate for embedding tokens
  }
  
  await logger.info(`Successfully generated ${embeddings.length} embeddings`);
  return embeddings;
}

// Parse LLM response for comma-separated values
export function parseCSVResponse(response) {
  return response
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

// Validate response count
export function validateResponseCount(items, min, max, context) {
  if (items.length < min || items.length > max) {
    console.warn(`Response validation warning for ${context}: got ${items.length}, expected ${min}-${max}`);
    console.warn(`Items received:`, items);
    // Don't throw error, just return what we got
    return items;
  }
  return items;
}

// Check for excluded terms in response
export function checkExclusions(items, exclusions) {
  const exclusionSet = new Set(exclusions.map(e => e.toLowerCase()));
  return items.filter(item => !exclusionSet.has(item.toLowerCase()));
}

// Rate limiting
let lastApiCall = Date.now();

export async function rateLimit() {
  const delay = parseInt(process.env.API_RATE_LIMIT_DELAY) || 100;
  const elapsed = Date.now() - lastApiCall;
  
  if (elapsed < delay) {
    await new Promise(resolve => setTimeout(resolve, delay - elapsed));
  }
  
  lastApiCall = Date.now();
}