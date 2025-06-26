#!/usr/bin/env node
/**
 * Test individual prompts with sample inputs
 * Usage: node scripts/test_prompts.js <prompt-file> [word]
 */

import { loadPrompt } from '../utils/prompt_loader.js';
import { generateCompletion } from '../utils/llm_utils.js';
import dotenv from 'dotenv';

dotenv.config();

async function testPrompt() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node scripts/test_prompts.js <prompt-file> [word]');
    console.log('Example: node scripts/test_prompts.js phase1_children.txt Animal');
    console.log('\nAvailable prompts:');
    console.log('  phase1_children.txt');
    console.log('  phase1_traits.txt');
    console.log('  phase1_acquaintances.txt');
    console.log('  phase1_roles.txt');
    console.log('  phase2_5_role_acquaintances.txt');
    console.log('  phase3_best_parent.txt');
    process.exit(1);
  }
  
  const promptFile = args[0];
  const testWord = args[1] || 'System'; // Default test word
  
  try {
    // Load the prompt with test variables
    const prompt = await loadPrompt(promptFile, {
      min: 3,
      max: 5,
      word: testWord,
      role: testWord,
      orphan: testWord,
      parent: 'Thing',
      count: 3,
      candidatesList: 'Object, Concept, Place',
      exclusionList: 'Thing, parent, child'
    });
    
    console.log('=== PROMPT TEMPLATE ===');
    console.log(prompt);
    console.log('\n=== TESTING WITH API ===');
    console.log(`Test word: ${testWord}`);
    console.log('Response:');
    
    // Test with actual API
    const config = { 
      dryRun: false,
      api: { timeout: 30000 }
    };
    
    const response = await generateCompletion(prompt, config, `test prompt ${promptFile}`);
    console.log(response);
    
    // Parse and analyze response
    console.log('\n=== PARSED RESPONSE ===');
    if (response !== 'NONE') {
      const items = response.split(',').map(s => s.trim());
      console.log(`Count: ${items.length}`);
      console.log('Items:', items);
    } else {
      console.log('Response: NONE');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testPrompt().catch(console.error);