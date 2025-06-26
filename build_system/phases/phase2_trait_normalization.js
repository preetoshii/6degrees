import { readJSON, writeJSON, readCSV, saveCheckpoint, loadCheckpoint,
         MASTER_WORDS_PATH, TRAITS_MASTER_PATH, RAW_TRAITS_PATH } from '../utils/file_utils.js';
import { generateEmbeddings } from '../utils/llm_utils.js';
import { normalize, calculateSimilarity } from '../utils/word_utils.js';

// Cluster traits using embeddings
async function clusterTraits(traits, embeddings, threshold) {
  const clusters = [];
  const assigned = new Set();
  
  for (let i = 0; i < traits.length; i++) {
    if (assigned.has(i)) continue;
    
    const cluster = [i];
    assigned.add(i);
    
    // Find similar traits
    for (let j = i + 1; j < traits.length; j++) {
      if (assigned.has(j)) continue;
      
      const similarity = calculateSimilarity(embeddings[i], embeddings[j]);
      if (similarity >= threshold) {
        cluster.push(j);
        assigned.add(j);
      }
    }
    
    clusters.push(cluster);
  }
  
  return clusters;
}

// Select canonical label from cluster
function selectCanonical(cluster, traits, traitCounts) {
  let bestIndex = cluster[0];
  let bestScore = -1;
  
  for (const index of cluster) {
    const trait = traits[index];
    const count = traitCounts[trait] || 0;
    const length = trait.length;
    
    // Score based on frequency (primary) and brevity (secondary)
    const score = count * 1000 - length;
    
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  
  return traits[bestIndex];
}

// Main phase 2 execution
export async function runPhase2(config) {
  console.log('Starting Phase 2: Trait Synonym Normalization & Promotion');
  
  // Load data
  const masterWords = await readJSON(MASTER_WORDS_PATH);
  const rawTraits = await readCSV(RAW_TRAITS_PATH);
  
  if (!masterWords || rawTraits.length === 0) {
    console.error('No data found. Run Phase 1 first.');
    return;
  }
  
  // Check for existing checkpoint
  const checkpoint = await loadCheckpoint(2);
  let processedWords = new Set(checkpoint?.data?.processed_words || []);
  
  // Ensure all words have traitsPromoted flag
  let updated = false;
  for (const word of masterWords) {
    if (!word.stages.traitsPromoted) {
      word.stages.traitsPromoted = false;
      updated = true;
    }
  }
  if (updated) {
    await writeJSON(MASTER_WORDS_PATH, masterWords);
  }
  
  // Build trait frequency map
  const traitCounts = {};
  const uniqueTraits = new Set();
  
  for (const [word, trait] of rawTraits) {
    if (!word || !trait) continue;
    
    const normalized = normalize(trait);
    uniqueTraits.add(normalized);
    traitCounts[normalized] = (traitCounts[normalized] || 0) + 1;
  }
  
  console.log(`Found ${uniqueTraits.size} unique traits`);
  
  // Generate embeddings for all unique traits
  const traitList = Array.from(uniqueTraits);
  console.log('Generating embeddings...');
  const embeddings = await generateEmbeddings(traitList, config);
  
  // Cluster traits
  console.log('Clustering traits...');
  const clusters = await clusterTraits(traitList, embeddings, config.embeddingThreshold);
  console.log(`Created ${clusters.length} trait clusters`);
  
  // Build canonical mapping
  const canonicalMap = {};
  for (const cluster of clusters) {
    const canonical = selectCanonical(cluster, traitList, traitCounts);
    
    for (const index of cluster) {
      canonicalMap[traitList[index]] = canonical;
    }
  }
  
  // Count exemplars for each canonical trait
  const traitExemplars = {};
  
  for (const [wordName, trait] of rawTraits) {
    if (!wordName || !trait) continue;
    
    const normalized = normalize(trait);
    const canonical = canonicalMap[normalized] || normalized;
    
    if (!traitExemplars[canonical]) {
      traitExemplars[canonical] = new Set();
    }
    traitExemplars[canonical].add(wordName);
  }
  
  // Promote traits with 2+ exemplars
  const promotedTraits = {};
  let promotionCount = 0;
  
  for (const [canonical, exemplars] of Object.entries(traitExemplars)) {
    if (exemplars.size >= config.promotionThreshold) {
      // Create trait word
      promotedTraits[canonical] = {
        word: canonical,
        type: "trait",
        exemplars: Array.from(exemplars).sort(),
        related_traits: [] // Could be populated in future enhancement
      };
      
      // Update master words
      for (const exemplarName of exemplars) {
        const word = masterWords.find(w => w.word === exemplarName);
        if (word && !word.stages.traitsPromoted) {
          if (!word.traits.includes(canonical)) {
            word.traits.push(canonical);
          }
          word.stages.traitsPromoted = true;
          processedWords.add(exemplarName);
        }
      }
      
      promotionCount++;
    }
  }
  
  // Save results
  await writeJSON(TRAITS_MASTER_PATH, promotedTraits);
  await writeJSON(MASTER_WORDS_PATH, masterWords);
  
  // Save checkpoint
  await saveCheckpoint(2, {
    phase_complete: true,
    processed_words: Array.from(processedWords),
    total_traits_promoted: promotionCount,
    total_clusters: clusters.length
  });
  
  console.log(`Phase 2 complete: ${promotionCount} traits promoted`);
  console.log(`Total clusters: ${clusters.length}`);
  
  return promotedTraits;
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
    await runPhase2(config);
  } catch (error) {
    console.error('Phase 2 failed:', error);
    process.exit(1);
  }
}