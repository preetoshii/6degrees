import { readJSON, writeJSON, appendToCSV, ensureDirectories, saveCheckpoint, loadCheckpoint,
         MASTER_WORDS_PATH, RAW_TRAITS_PATH, RAW_ACQUAINTANCES_PATH, RAW_PURPOSES_PATH } from '../utils/file_utils.js';
import { generateCompletion, parseCSVResponse, validateResponseCount, checkExclusions, rateLimit } from '../utils/llm_utils.js';
import { normalize, isAncestor, generateExclusionList, findWord } from '../utils/word_utils.js';
import { createLogger } from '../utils/logger.js';
import { monitor } from '../utils/monitor.js';
import { loadPrompt } from '../utils/prompt_loader.js';

const logger = createLogger('Phase1');

// Initialize artifacts
async function initializeArtifacts() {
  await logger.info('Initializing artifacts');
  await ensureDirectories();
  
  // Check if master_words.json already exists
  let masterWords = await readJSON(MASTER_WORDS_PATH);
  
  if (!masterWords) {
    await logger.info('Creating initial God Word: Thing');
    // Create initial structure with God Word
    masterWords = [{
      word: "Thing",
      type: "thing",
      parent: null,
      children: [],
      traits: [],
      acquaintances: [],
      purposes: [],
      stages: {
        childrenDone: false,
        rawLogged: false
      }
    }];
    
    await writeJSON(MASTER_WORDS_PATH, masterWords);
  } else {
    await logger.info(`Found existing master words: ${masterWords.length} words`);
  }
  
  // Initialize CSV files if they don't exist
  await appendToCSV(RAW_TRAITS_PATH, []);
  await appendToCSV(RAW_ACQUAINTANCES_PATH, []);
  await appendToCSV(RAW_PURPOSES_PATH, []);
  
  return masterWords;
}

// Generate children for a word
async function generateChildren(word, config) {
  if (config.dryRun) {
    // Return mock data for testing
    const mockChildren = {
      "Thing": ["Animal", "Object", "Concept", "System", "Place"],
      "Animal": ["Cat", "Dog", "Bird", "Fish", "Horse"],
      "Object": ["Tool", "Furniture", "Vehicle", "Toy", "Container"],
      "Concept": ["Emotion", "Idea", "Theory", "Belief", "Philosophy"]
    };
    return mockChildren[word.word] || ["Child1", "Child2", "Child3"];
  }
  
  const prompt = await loadPrompt('phase1_children.txt', {
    min: config.itemCounts.children.min,
    max: config.itemCounts.children.max,
    word: word.word
  });
  
  const response = await generateCompletion(prompt, config, `children for ${word.word}`);
  const children = parseCSVResponse(response, `children for ${word.word}`);
  
  // If we got no children due to error response, use fallback for "Thing"
  if (children.length === 0 && word.word === 'Thing') {
    await logger.warn('Using fallback children for Thing due to API confusion');
    return ['Animal', 'Object', 'Concept', 'System', 'Place'];
  }
  
  return validateResponseCount(
    children, 
    config.itemCounts.children.min, 
    config.itemCounts.children.max,
    `children for ${word.word}`
  );
}

// Generate traits for a word
async function generateTraits(word, config) {
  if (config.dryRun) {
    // Return mock data for testing
    return ["trait1", "trait2", "trait3", "trait4"];
  }
  
  const prompt = await loadPrompt('phase1_traits.txt', {
    min: config.itemCounts.traits.min,
    max: config.itemCounts.traits.max,
    word: word.word
  });
  
  const response = await generateCompletion(prompt, config, `traits for ${word.word}`);
  const traits = parseCSVResponse(response, `traits for ${word.word}`);
  
  return validateResponseCount(
    traits,
    config.itemCounts.traits.min,
    config.itemCounts.traits.max,
    `traits for ${word.word}`
  );
}

// Generate acquaintances for a word
async function generateAcquaintances(word, exclusions, config) {
  if (config.dryRun) {
    // Return mock data for testing
    return ["acquaintance1", "acquaintance2", "acquaintance3", "acquaintance4"];
  }
  
  const exclusionList = exclusions.join(', ');
  const prompt = await loadPrompt('phase1_acquaintances.txt', {
    min: config.itemCounts.acquaintances.min,
    max: config.itemCounts.acquaintances.max,
    word: word.word,
    exclusionList: exclusionList
  });
  
  const response = await generateCompletion(prompt, config, `acquaintances for ${word.word}`);
  let acquaintances = parseCSVResponse(response, `acquaintances for ${word.word}`);
  
  // Check for exclusions
  acquaintances = checkExclusions(acquaintances, exclusions);
  
  // Retry once if we have exclusions
  if (acquaintances.length < config.itemCounts.acquaintances.min) {
    console.warn(`Retrying acquaintances for ${word.word} due to exclusions`);
    const retryPrompt = await loadPrompt('phase1_acquaintances_retry.txt', {
      prompt: prompt,
      exclusionList: exclusionList
    });
    const retryResponse = await generateCompletion(retryPrompt, config, `acquaintances retry for ${word.word}`);
    acquaintances = checkExclusions(parseCSVResponse(retryResponse, `acquaintances retry for ${word.word}`), exclusions);
  }
  
  return acquaintances;
}

// Generate roles for a word
async function generateRoles(word, config) {
  if (config.dryRun) {
    // Return mock data for testing - some words have roles, some don't
    const mockRoles = {
      "Tool": ["Building", "Fixing"],
      "Animal": ["Companion"],
      "System": ["Organizing", "Managing"]
    };
    return mockRoles[word.word] || [];
  }
  
  const prompt = await loadPrompt('phase1_roles.txt', {
    min: config.itemCounts.roles.min || 1,
    max: config.itemCounts.roles.max || 3,
    word: word.word
  });
  
  const response = await generateCompletion(prompt, config, `roles for ${word.word}`);
  
  if (response.toUpperCase() === 'NONE') {
    return [];
  }
  
  const roles = parseCSVResponse(response, `roles for ${word.word}`);
  return roles.slice(0, config.itemCounts.roles.max || 3); // Ensure we don't exceed max
}

// Process a single word
async function processWord(word, masterWords, config, queue, stats) {
  const startTime = Date.now();
  await logger.info(`Processing word: ${word.word}`, {
    parent: word.parent,
    queueLength: queue.length,
    totalWords: masterWords.length
  });
  
  if (config.verbose) {
    console.log(`Processing: ${word.word}`);
  }
  
  // Build exclusion list
  const exclusions = generateExclusionList(word, masterWords);
  await logger.debug(`Exclusion list for ${word.word}:`, exclusions);
  
  try {
    // Generate all metadata in sequence (could be parallelized in future)
    await logger.debug(`Generating children for ${word.word}`);
    if (!config.dryRun) await rateLimit();
    const children = await generateChildren(word, config);
    if (!config.dryRun) {
      stats.api_calls_made++;
      monitor.incrementAPICall();
    }
    await logger.debug(`Generated ${children.length} children for ${word.word}:`, children);
    
    if (!config.dryRun) await rateLimit();
    const traits = await generateTraits(word, config);
    if (!config.dryRun) stats.api_calls_made++;
    
    if (!config.dryRun) await rateLimit();
    const acquaintances = await generateAcquaintances(word, exclusions, config);
    if (!config.dryRun) stats.api_calls_made++;
    
    if (!config.dryRun) await rateLimit();
    const roles = await generateRoles(word, config);
    if (!config.dryRun) stats.api_calls_made++;
    
    // Mark children as done
    word.stages.childrenDone = true;
    
    // Process children
    for (const childName of children) {
      const normalized = normalize(childName);
      
      // Check if child already exists
      if (!findWord(childName, masterWords)) {
        // Check for cycles
        if (isAncestor(childName, word.word, masterWords)) {
          await logger.warn(`Cycle detected: ${childName} is ancestor of ${word.word}`);
          console.warn(`Skipping ${childName} as child of ${word.word} - would create cycle`);
          monitor.stats.phase3.cyclesDetected++;
          continue;
        }
        
        // Create new child
        const newChild = {
          word: childName,
          type: "thing",
          parent: word.word,
          children: [],
          traits: [],
          acquaintances: [],
          purposes: [],
          stages: {
            childrenDone: false,
            rawLogged: false
          }
        };
        
        masterWords.push(newChild);
        queue.push(childName);
      }
      
      // Add to parent's children if not already there
      if (!word.children.includes(childName)) {
        word.children.push(childName);
      }
    }
    
    // Write raw metadata to CSV
    const rawTraits = [];
    for (const trait of traits) {
      rawTraits.push([word.word, trait]);
    }
    await appendToCSV(RAW_TRAITS_PATH, rawTraits);
    
    const rawAcquaintances = [];
    for (const acq of acquaintances) {
      rawAcquaintances.push([word.word, acq]);
    }
    await appendToCSV(RAW_ACQUAINTANCES_PATH, rawAcquaintances);
    
    if (roles.length > 0) {
      const rawPurposes = [];
      for (const role of roles) {
        rawPurposes.push([word.word, role]);
      }
      await appendToCSV(RAW_PURPOSES_PATH, rawPurposes);
    }
    
    // Mark raw logging as done
    word.stages.rawLogged = true;
    stats.words_processed++;
    
    // Save progress
    await writeJSON(MASTER_WORDS_PATH, masterWords);
    
    // Checkpoint periodically
    if (stats.words_processed % config.checkpointFrequency === 0) {
      await saveCheckpoint(1, {
        last_processed_word: word.word,
        queue_state: queue.slice(0, 10), // Save first 10 items
        ...stats
      });
    }
    
  } catch (error) {
    await logger.error(`Failed to process ${word.word}`, error);
    console.error(`Error processing ${word.word}:`, error);
    stats.errors_encountered++;
    monitor.incrementError();
    throw error;
  }
  
  const duration = Date.now() - startTime;
  await logger.logPerformance(`Process word ${word.word}`, duration);
  monitor.incrementWordsProcessed();
}

// Main BFS expansion
export async function runPhase1(config) {
  await logger.info('=== Starting Phase 1: Core Tree Growth ===');
  console.log('Starting Phase 1: Core Tree Growth');
  monitor.startPhase('phase1');
  
  const masterWords = await initializeArtifacts();
  const queue = [];
  
  // Check for existing checkpoint
  const checkpoint = await loadCheckpoint(1);
  const stats = checkpoint ? checkpoint.stats : {
    words_processed: 0,
    errors_encountered: 0,
    api_calls_made: 0
  };
  
  // Rebuild queue from incomplete words
  for (const word of masterWords) {
    if (!word.stages.childrenDone || !word.stages.rawLogged) {
      queue.push(word.word);
    }
  }
  
  // If no incomplete words, start with Thing
  if (queue.length === 0 && masterWords.length === 1) {
    queue.push("Thing");
  }
  
  console.log(`Queue has ${queue.length} words to process`);
  console.log(`Target word count: ${config.targetWordCount}`);
  
  // Count fully processed words
  const getFullyProcessedCount = () => {
    return masterWords.filter(w => w.stages.childrenDone && w.stages.rawLogged).length;
  };
  
  // BFS expansion loop
  while (queue.length > 0) {
    const fullyProcessedCount = getFullyProcessedCount();
    
    // Check if we've reached our target of fully processed words
    if (fullyProcessedCount >= config.targetWordCount) {
      console.log(`Reached target of ${config.targetWordCount} fully processed words`);
      break;
    }
    
    const currentWordName = queue.shift();
    const currentWord = findWord(currentWordName, masterWords);
    
    if (!currentWord) {
      console.error(`Word not found: ${currentWordName}`);
      continue;
    }
    
    if (currentWord.stages.childrenDone && currentWord.stages.rawLogged) {
      continue; // Already processed
    }
    
    await processWord(currentWord, masterWords, config, queue, stats);
    
    if (config.verbose) {
      const newFullyProcessedCount = getFullyProcessedCount();
      console.log(`📊 Progress: ${newFullyProcessedCount}/${config.targetWordCount} fully processed, ${masterWords.length} total words, ${queue.length} in queue`);
    } else {
      // Always show some progress
      const newFullyProcessedCount = getFullyProcessedCount();
      const percentage = Math.round((newFullyProcessedCount / config.targetWordCount) * 100);
      console.log(`🔄 Phase 1 Progress: ${percentage}% (${newFullyProcessedCount}/${config.targetWordCount} words complete)`);
    }
  }
  
  // Final save
  await writeJSON(MASTER_WORDS_PATH, masterWords);
  await saveCheckpoint(1, {
    phase_complete: true,
    total_words: masterWords.length,
    ...stats
  });
  
  const finalFullyProcessedCount = getFullyProcessedCount();
  console.log(`Phase 1 complete: ${finalFullyProcessedCount} fully processed words (${masterWords.length} total)`);
  console.log(`API calls made: ${stats.api_calls_made}`);
  console.log(`Errors encountered: ${stats.errors_encountered}`);
  
  monitor.endPhase('phase1');
  await logger.info('=== Phase 1 Complete ===', {
    totalWords: masterWords.length,
    apiCalls: stats.api_calls_made,
    errors: stats.errors_encountered,
    duration: monitor.stats.performance.phasesDurations.phase1
  });
  
  return masterWords;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const configPath = process.argv[2] || '../config/test-sample.json';
  const config = await readJSON(configPath);
  
  if (!config) {
    console.error('Config file not found:', configPath);
    process.exit(1);
  }
  
  try {
    await runPhase1(config);
  } catch (error) {
    console.error('Phase 1 failed:', error);
    process.exit(1);
  }
}