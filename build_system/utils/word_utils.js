import pluralize from 'pluralize';

// Normalize a word (lowercase, singular)
export function normalize(word) {
  if (!word) return '';
  return pluralize.singular(word.toLowerCase().trim());
}

// Check if a word is an ancestor of another
export function isAncestor(candidate, currentWord, masterWords) {
  const normalizedCandidate = normalize(candidate);
  let node = masterWords.find(w => w.word === currentWord);
  
  while (node && node.parent) {
    if (normalize(node.parent) === normalizedCandidate) {
      return true;
    }
    node = masterWords.find(w => w.word === node.parent);
  }
  
  return false;
}

// Check if a word creates a cycle
export function wouldCreateCycle(parent, child, masterWords) {
  return isAncestor(child, parent, masterWords);
}

// Build word index for O(1) lookups
export function buildWordIndex(masterWords) {
  const index = {};
  
  masterWords.forEach((word, i) => {
    const normalized = normalize(word.word);
    index[normalized] = { index: i, normalized };
    
    // Also index the original form if different
    if (word.word.toLowerCase() !== normalized) {
      index[word.word.toLowerCase()] = { index: i, normalized };
    }
  });
  
  return index;
}

// Find word in master list
export function findWord(wordName, masterWords, wordIndex = null) {
  if (wordIndex) {
    const normalized = normalize(wordName);
    const entry = wordIndex[normalized];
    return entry ? masterWords[entry.index] : null;
  }
  
  // Fallback to linear search
  const normalized = normalize(wordName);
  return masterWords.find(w => normalize(w.word) === normalized);
}

// Generate exclusion list for acquaintances
export function generateExclusionList(word, masterWords) {
  const exclusions = [];
  
  // Add parent
  if (word.parent) {
    exclusions.push(word.parent);
  }
  
  // Add children
  exclusions.push(...(word.children || []));
  
  // Add existing traits (from raw data)
  exclusions.push(...(word.traits || []));
  
  // Add word itself and common variations
  exclusions.push(word.word);
  exclusions.push(pluralize.plural(word.word));
  exclusions.push(pluralize.singular(word.word));
  
  // Remove duplicates and normalize
  return [...new Set(exclusions.map(e => normalize(e)))];
}

// Calculate semantic similarity (placeholder - would use embeddings in production)
export function calculateSimilarity(embedding1, embedding2) {
  // Cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// Find nearest neighbors
export function findNearestNeighbors(targetEmbedding, candidateEmbeddings, k = 20) {
  const similarities = candidateEmbeddings.map((embedding, index) => ({
    index,
    similarity: calculateSimilarity(targetEmbedding, embedding)
  }));
  
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  return similarities.slice(0, k);
}

// Validate word metadata
export function validateWordMetadata(word) {
  const errors = [];
  
  if (!word.word || typeof word.word !== 'string') {
    errors.push('Missing or invalid word field');
  }
  
  if (!word.type || !['thing', 'trait', 'role'].includes(word.type)) {
    errors.push('Invalid word type');
  }
  
  if (word.type === 'thing' && word.parent === undefined) {
    errors.push('Thing word missing parent field');
  }
  
  if (!Array.isArray(word.children)) {
    errors.push('Children must be an array');
  }
  
  return errors;
}

// Clean word for display
export function cleanWordForDisplay(word) {
  return word
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}