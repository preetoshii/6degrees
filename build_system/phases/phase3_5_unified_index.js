import { readJSON, writeJSON, saveCheckpoint,
         MASTER_WORDS_PATH, TRAITS_MASTER_PATH, ROLES_MASTER_PATH, UNIFIED_MASTER_PATH } from '../utils/file_utils.js';

// Main phase 3.5 execution
export async function runPhase3_5(config) {
  console.log('Starting Phase 3.5: Build Unified Index');
  
  // Load all data sources
  const masterWords = await readJSON(MASTER_WORDS_PATH) || [];
  const traitsWords = await readJSON(TRAITS_MASTER_PATH) || {};
  const rolesWords = await readJSON(ROLES_MASTER_PATH) || {};
  
  if (masterWords.length === 0) {
    console.error('No master words found. Run previous phases first.');
    return;
  }
  
  // Build unified structure
  const unified = {
    master_words: {},
    traits: {},
    roles: {},
    game_config: {
      daily_puzzle: {
        origin: null,
        destination: null,
        optimal_path_length: 6,
        date: new Date().toISOString().split('T')[0]
      },
      difficulty_settings: {
        easy: 4,
        normal: 6,
        hard: 8,
        expert: 10
      }
    },
    stats: {
      total_words: 0,
      thing_words: 0,
      trait_words: 0,
      role_words: 0,
      total_nodes: 0
    }
  };
  
  // Convert arrays to objects for O(1) lookups
  for (const word of masterWords) {
    unified.master_words[word.word] = word;
    unified.stats.thing_words++;
  }
  
  // Add traits
  unified.traits = traitsWords;
  unified.stats.trait_words = Object.keys(traitsWords).length;
  
  // Add roles
  unified.roles = rolesWords;
  unified.stats.role_words = Object.keys(rolesWords).length;
  
  // Calculate total stats
  unified.stats.total_words = unified.stats.thing_words;
  unified.stats.total_nodes = unified.stats.thing_words + 
                             unified.stats.trait_words + 
                             unified.stats.role_words;
  
  // Select a random daily puzzle
  const allThingWords = Object.keys(unified.master_words);
  if (allThingWords.length >= 2) {
    // Pick random destination
    const destIndex = Math.floor(Math.random() * allThingWords.length);
    unified.game_config.daily_puzzle.destination = allThingWords[destIndex];
    
    // Find a word roughly 6 steps away (simplified for now)
    // In production, would use actual path-finding algorithm
    const originCandidates = allThingWords.filter(w => w !== unified.game_config.daily_puzzle.destination);
    const originIndex = Math.floor(Math.random() * originCandidates.length);
    unified.game_config.daily_puzzle.origin = originCandidates[originIndex];
  }
  
  // Create lightweight index for frontend
  const wordIndex = {};
  
  // Index thing words
  for (const word of Object.keys(unified.master_words)) {
    wordIndex[word] = "thing";
  }
  
  // Index trait words
  for (const word of Object.keys(unified.traits)) {
    wordIndex[word] = "trait";
  }
  
  // Index role words
  for (const word of Object.keys(unified.roles)) {
    wordIndex[word] = "role";
  }
  
  // Check for duplicates
  const duplicates = [];
  const seen = new Set();
  
  for (const word of Object.keys(wordIndex)) {
    const normalized = word.toLowerCase();
    if (seen.has(normalized)) {
      duplicates.push(word);
    }
    seen.add(normalized);
  }
  
  if (duplicates.length > 0) {
    console.warn(`Found ${duplicates.length} duplicate words:`, duplicates);
  }
  
  // Save unified index
  await writeJSON(UNIFIED_MASTER_PATH, unified);
  await writeJSON(UNIFIED_MASTER_PATH.replace('.json', '_index.json'), wordIndex);
  
  // Save checkpoint
  await saveCheckpoint('3_5', {
    phase_complete: true,
    ...unified.stats,
    duplicates_found: duplicates.length
  });
  
  console.log(`Phase 3.5 complete:`);
  console.log(`- Total thing words: ${unified.stats.thing_words}`);
  console.log(`- Total trait words: ${unified.stats.trait_words}`);
  console.log(`- Total role words: ${unified.stats.role_words}`);
  console.log(`- Total nodes: ${unified.stats.total_nodes}`);
  console.log(`- Daily puzzle: ${unified.game_config.daily_puzzle.origin} → ${unified.game_config.daily_puzzle.destination}`);
  
  return unified;
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
    await runPhase3_5(config);
  } catch (error) {
    console.error('Phase 3.5 failed:', error);
    process.exit(1);
  }
}