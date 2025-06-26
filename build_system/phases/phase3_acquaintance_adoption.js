import { readJSON, writeJSON, readCSV, saveCheckpoint, loadCheckpoint,
         MASTER_WORDS_PATH, RAW_ACQUAINTANCES_PATH, ROLES_MASTER_PATH } from '../utils/file_utils.js';
import { generateEmbeddings, generateCompletion, rateLimit } from '../utils/llm_utils.js';
import { normalize, findWord, wouldCreateCycle, findNearestNeighbors, buildWordIndex } from '../utils/word_utils.js';

// Build extended candidate strings for better semantic matching
function buildCandidateStrings(masterWords) {
  return masterWords.map(word => {
    const parentInfo = word.parent ? `parent: ${word.parent}` : 'root';
    const childrenInfo = word.children.slice(0, 3).join(', ');
    return `${word.word} — ${parentInfo}; children: ${childrenInfo}`;
  });
}

// Find best parent using LLM from shortlist
async function findBestParent(orphan, shortlist, config) {
  const candidatesList = shortlist.map(s => s.word).join(', ');
  
  const prompt = `I have ${shortlist.length} potential parent categories for "${orphan}":
${candidatesList}

Which single category best serves as the parent for "${orphan}"?
Reply with exactly one choice from the list.`;
  
  const response = await generateCompletion(prompt, config, `parent selection for ${orphan}`);
  const selected = response.trim();
  
  // Validate response is in shortlist
  const candidate = shortlist.find(s => s.word.toLowerCase() === selected.toLowerCase());
  if (!candidate) {
    console.warn(`LLM selected invalid parent "${selected}" for ${orphan}`);
    return shortlist[0]; // Fallback to best embedding match
  }
  
  return candidate;
}

// Validate parent-child relationship
async function validateParentChild(orphan, parent, config) {
  const prompt = `Is "${orphan}" a kind of "${parent}"? Answer yes or no only.`;
  const response = await generateCompletion(prompt, config, `validation for ${orphan} -> ${parent}`);
  
  return response.toLowerCase().includes('yes');
}

// Process a single orphan
async function adoptOrphan(orphan, masterWords, candidateEmbeddings, config, stats) {
  console.log(`Adopting orphan: ${orphan}`);
  
  // Generate embedding for orphan
  const orphanEmbedding = (await generateEmbeddings([orphan], config))[0];
  
  // Find nearest neighbors
  let neighbors = findNearestNeighbors(orphanEmbedding, candidateEmbeddings, 20);
  let shortlist = neighbors.map(n => masterWords[n.index]);
  
  // Progressive fallback strategy
  let chosenParent = null;
  let attempts = 0;
  
  while (!chosenParent && shortlist.length > 0 && attempts < 5) {
    attempts++;
    
    // Get LLM to select best parent
    if (!config.dryRun) {
      await rateLimit();
      const candidate = await findBestParent(orphan, shortlist.slice(0, Math.min(10, shortlist.length)), config);
      stats.api_calls_made++;
      
      // Check for cycles
      if (wouldCreateCycle(candidate.word, orphan, masterWords)) {
        console.warn(`Cycle detected: ${orphan} -> ${candidate.word}`);
        shortlist = shortlist.filter(s => s.word !== candidate.word);
        continue;
      }
      
      // Validate parent-child relationship
      await rateLimit();
      const isValid = await validateParentChild(orphan, candidate.word, config);
      stats.api_calls_made++;
      
      if (isValid) {
        chosenParent = candidate;
      } else {
        console.warn(`Validation failed: ${orphan} is not a kind of ${candidate.word}`);
        shortlist = shortlist.filter(s => s.word !== candidate.word);
      }
    } else {
      // Dry run mode
      chosenParent = shortlist[0];
    }
    
    // Expand search if needed
    if (!chosenParent && attempts === 3) {
      neighbors = findNearestNeighbors(orphanEmbedding, candidateEmbeddings, 40);
      shortlist = neighbors.map(n => masterWords[n.index]);
      console.log(`Expanded search to ${shortlist.length} candidates`);
    }
  }
  
  // Ultimate fallback - find most general category
  if (!chosenParent && !config.dryRun) {
    console.warn(`Using ultimate fallback for ${orphan}`);
    const generalCategories = masterWords.filter(w => 
      w.parent === 'Thing' || w.parent === null
    );
    
    if (generalCategories.length > 0) {
      await rateLimit();
      chosenParent = await findBestParent(orphan, generalCategories, config);
      stats.api_calls_made++;
    }
  }
  
  return chosenParent;
}

// Main phase 3 execution
export async function runPhase3(config) {
  console.log('Starting Phase 3: Acquaintance Adoption & Integration');
  
  // Load data
  const masterWords = await readJSON(MASTER_WORDS_PATH);
  const rawAcquaintances = await readCSV(RAW_ACQUAINTANCES_PATH);
  const roleWords = await readJSON(ROLES_MASTER_PATH) || {};
  
  if (!masterWords || rawAcquaintances.length === 0) {
    console.log('No acquaintance data found. Skipping Phase 3.');
    return;
  }
  
  // Build word index for fast lookups
  const wordIndex = buildWordIndex(masterWords);
  
  // Collect all unique acquaintances
  const allAcquaintances = new Set();
  
  // From thing word acquaintances
  for (const [source, acq] of rawAcquaintances) {
    if (!source || !acq) continue;
    allAcquaintances.add(normalize(acq));
  }
  
  // From role word acquaintances
  for (const role of Object.values(roleWords)) {
    if (role.acquaintances) {
      for (const acq of role.acquaintances) {
        allAcquaintances.add(normalize(acq));
      }
    }
  }
  
  console.log(`Found ${allAcquaintances.size} unique acquaintances`);
  
  // Identify orphans (acquaintances not in master words)
  const orphans = [];
  for (const acq of allAcquaintances) {
    if (!findWord(acq, masterWords, wordIndex)) {
      orphans.push(acq);
    }
  }
  
  console.log(`Found ${orphans.length} orphans to adopt`);
  
  if (orphans.length === 0) {
    console.log('No orphans to process');
    return;
  }
  
  // Prepare embeddings for all existing words
  console.log('Generating embeddings for parent candidates...');
  const candidateStrings = buildCandidateStrings(masterWords);
  const candidateEmbeddings = await generateEmbeddings(candidateStrings, config);
  
  // Process each orphan
  const stats = {
    orphans_processed: 0,
    orphans_adopted: 0,
    api_calls_made: 0
  };
  
  for (const orphanName of orphans) {
    try {
      // Create placeholder node
      const orphanNode = {
        word: orphanName,
        type: "thing",
        parent: null,
        children: [],
        traits: [],
        acquaintances: [],
        purposes: [],
        stages: {
          childrenDone: true, // No children to generate for orphans
          rawLogged: true,
          orphanAdopted: false
        }
      };
      
      // Find adoptive parent
      const parent = await adoptOrphan(orphanName, masterWords, candidateEmbeddings, config, stats);
      
      if (parent) {
        orphanNode.parent = parent.word;
        orphanNode.stages.orphanAdopted = true;
        
        // Add to parent's children
        if (!parent.children.includes(orphanName)) {
          parent.children.push(orphanName);
        }
        
        console.log(`Adopted ${orphanName} under ${parent.word}`);
        stats.orphans_adopted++;
      } else {
        console.error(`Failed to find parent for ${orphanName}`);
      }
      
      // Add orphan to master words
      masterWords.push(orphanNode);
      stats.orphans_processed++;
      
    } catch (error) {
      console.error(`Error processing orphan ${orphanName}:`, error);
    }
  }
  
  // Attach acquaintance edges
  console.log('Attaching acquaintance edges...');
  
  // Rebuild word index with new nodes
  const updatedIndex = buildWordIndex(masterWords);
  
  // Process thing word acquaintances
  for (const [sourceName, acqName] of rawAcquaintances) {
    if (!sourceName || !acqName) continue;
    
    const sourceWord = findWord(sourceName, masterWords, updatedIndex);
    const acqWord = findWord(acqName, masterWords, updatedIndex);
    
    if (sourceWord && acqWord) {
      if (!sourceWord.acquaintances.includes(acqWord.word)) {
        sourceWord.acquaintances.push(acqWord.word);
      }
    }
  }
  
  // Save results
  await writeJSON(MASTER_WORDS_PATH, masterWords);
  
  // Save checkpoint
  await saveCheckpoint(3, {
    phase_complete: true,
    ...stats
  });
  
  console.log(`Phase 3 complete:`);
  console.log(`- Orphans processed: ${stats.orphans_processed}`);
  console.log(`- Orphans adopted: ${stats.orphans_adopted}`);
  console.log(`- API calls made: ${stats.api_calls_made}`);
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
    await runPhase3(config);
  } catch (error) {
    console.error('Phase 3 failed:', error);
    process.exit(1);
  }
}