import { readJSON, writeJSON, readCSV, saveCheckpoint, loadCheckpoint,
         MASTER_WORDS_PATH, ROLES_MASTER_PATH, RAW_PURPOSES_PATH } from '../utils/file_utils.js';
import { generateEmbeddings, generateCompletion, parseCSVResponse, rateLimit } from '../utils/llm_utils.js';
import { normalize, calculateSimilarity } from '../utils/word_utils.js';

// Cluster roles using embeddings
async function clusterRoles(roles, embeddings, threshold) {
  const clusters = [];
  const assigned = new Set();
  
  for (let i = 0; i < roles.length; i++) {
    if (assigned.has(i)) continue;
    
    const cluster = [i];
    assigned.add(i);
    
    // Find similar roles
    for (let j = i + 1; j < roles.length; j++) {
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
function selectCanonical(cluster, roles, roleCounts) {
  let bestIndex = cluster[0];
  let bestScore = -1;
  
  for (const index of cluster) {
    const role = roles[index];
    const count = roleCounts[role] || 0;
    const length = role.length;
    
    // Score based on frequency (primary) and brevity (secondary)
    const score = count * 1000 - length;
    
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  
  return roles[bestIndex];
}

// Generate acquaintances for a role
async function generateRoleAcquaintances(role, config) {
  const prompt = `List ${config.itemCounts.acquaintances.min}-${config.itemCounts.acquaintances.max} nouns that symbolically or functionally relate to the role/purpose of ${role}.
These should be concepts, objects, or ideas associated with ${role} as a function or purpose.
Return comma-separated nouns only. Count should be between ${config.itemCounts.acquaintances.min}-${config.itemCounts.acquaintances.max} based on strength of association.`;
  
  const response = await generateCompletion(prompt, config, `role acquaintances for ${role}`);
  const acquaintances = parseCSVResponse(response);
  
  return acquaintances.slice(0, config.itemCounts.acquaintances.max);
}

// Main phase 2.5 execution
export async function runPhase2_5(config) {
  console.log('Starting Phase 2.5: Role Normalization & Promotion');
  
  // Load data
  const masterWords = await readJSON(MASTER_WORDS_PATH);
  const rawPurposes = await readCSV(RAW_PURPOSES_PATH);
  
  if (!masterWords || rawPurposes.length === 0) {
    console.log('No role data found. Skipping Phase 2.5.');
    return {};
  }
  
  // Check for existing checkpoint
  const checkpoint = await loadCheckpoint('2_5');
  let processedWords = new Set(checkpoint?.data?.processed_words || []);
  
  // Ensure all words have rolesPromoted flag
  let updated = false;
  for (const word of masterWords) {
    if (!word.stages.rolesPromoted) {
      word.stages.rolesPromoted = false;
      updated = true;
    }
  }
  if (updated) {
    await writeJSON(MASTER_WORDS_PATH, masterWords);
  }
  
  // Build role frequency map
  const roleCounts = {};
  const uniqueRoles = new Set();
  
  for (const [word, role] of rawPurposes) {
    if (!word || !role) continue;
    
    const normalized = normalize(role);
    uniqueRoles.add(normalized);
    roleCounts[normalized] = (roleCounts[normalized] || 0) + 1;
  }
  
  console.log(`Found ${uniqueRoles.size} unique roles`);
  
  if (uniqueRoles.size === 0) {
    console.log('No roles to process');
    return {};
  }
  
  // Generate embeddings for all unique roles
  const roleList = Array.from(uniqueRoles);
  console.log('Generating embeddings...');
  const embeddings = await generateEmbeddings(roleList, config);
  
  // Cluster roles
  console.log('Clustering roles...');
  const clusters = await clusterRoles(roleList, embeddings, config.embeddingThreshold);
  console.log(`Created ${clusters.length} role clusters`);
  
  // Build canonical mapping
  const canonicalMap = {};
  for (const cluster of clusters) {
    const canonical = selectCanonical(cluster, roleList, roleCounts);
    
    for (const index of cluster) {
      canonicalMap[roleList[index]] = canonical;
    }
  }
  
  // Count exemplars for each canonical role
  const roleExemplars = {};
  
  for (const [wordName, role] of rawPurposes) {
    if (!wordName || !role) continue;
    
    const normalized = normalize(role);
    const canonical = canonicalMap[normalized] || normalized;
    
    if (!roleExemplars[canonical]) {
      roleExemplars[canonical] = new Set();
    }
    roleExemplars[canonical].add(wordName);
  }
  
  // Promote roles with 2+ exemplars and generate acquaintances
  const promotedRoles = {};
  let promotionCount = 0;
  
  for (const [canonical, exemplars] of Object.entries(roleExemplars)) {
    if (exemplars.size >= config.promotionThreshold) {
      // Generate acquaintances for the role
      let acquaintances = [];
      if (!config.dryRun) {
        await rateLimit();
        acquaintances = await generateRoleAcquaintances(canonical, config);
      } else {
        acquaintances = ["association1", "association2", "association3"];
      }
      
      // Create role word
      promotedRoles[canonical] = {
        word: canonical,
        type: "role",
        exemplars: Array.from(exemplars).sort(),
        acquaintances: acquaintances
      };
      
      // Update master words
      for (const exemplarName of exemplars) {
        const word = masterWords.find(w => w.word === exemplarName);
        if (word && !word.stages.rolesPromoted) {
          if (!word.purposes) {
            word.purposes = [];
          }
          if (!word.purposes.includes(canonical)) {
            word.purposes.push(canonical);
          }
          word.stages.rolesPromoted = true;
          processedWords.add(exemplarName);
        }
      }
      
      promotionCount++;
    }
  }
  
  // Save results
  await writeJSON(ROLES_MASTER_PATH, promotedRoles);
  await writeJSON(MASTER_WORDS_PATH, masterWords);
  
  // Save checkpoint
  await saveCheckpoint('2_5', {
    phase_complete: true,
    processed_words: Array.from(processedWords),
    total_roles_promoted: promotionCount,
    total_clusters: clusters.length
  });
  
  console.log(`Phase 2.5 complete: ${promotionCount} roles promoted`);
  console.log(`Total clusters: ${clusters.length}`);
  
  return promotedRoles;
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
    await runPhase2_5(config);
  } catch (error) {
    console.error('Phase 2.5 failed:', error);
    process.exit(1);
  }
}