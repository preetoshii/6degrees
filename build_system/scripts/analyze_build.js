#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { readJSON } from '../utils/file_utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const ARCHIVE_DIR = path.join(DATA_DIR, 'archive');

async function analyzeBuild() {
  console.log('=== Six Degrees Build Analyzer ===\n');
  
  // Load current build
  const unifiedPath = path.join(DATA_DIR, 'processed/unified_master.json');
  const unified = await readJSON(unifiedPath);
  
  if (!unified) {
    console.error('No unified_master.json found. Run build first.');
    return;
  }
  
  // Basic structure analysis
  const analysis = {
    structural: {
      totalWords: unified.stats.total_words,
      thingWords: unified.stats.thing_words,
      traitWords: unified.stats.trait_words,
      roleWords: unified.stats.role_words,
      totalNodes: unified.stats.total_nodes
    },
    connectivity: {
      orphanedWords: [],
      averageConnections: 0,
      minConnections: Infinity,
      maxConnections: 0,
      connectionDistribution: {}
    },
    relationships: {
      averageChildren: 0,
      averageTraits: 0,
      averageAcquaintances: 0,
      emptyRelationships: []
    },
    examples: {
      wellConnected: [],
      poorlyConnected: [],
      interestingPaths: []
    }
  };
  
  // Analyze each word
  let totalConnections = 0;
  let wordsWithChildren = 0;
  let totalChildren = 0;
  let totalTraits = 0;
  let totalAcquaintances = 0;
  
  for (const [wordName, wordData] of Object.entries(unified.master_words)) {
    // Count connections
    const connections = [
      ...(wordData.parent ? [wordData.parent] : []),
      ...(wordData.children || []),
      ...(wordData.traits || []),
      ...(wordData.acquaintances || []),
      ...(wordData.purposes || [])
    ];
    
    const connectionCount = connections.length;
    totalConnections += connectionCount;
    
    // Track min/max
    analysis.connectivity.minConnections = Math.min(analysis.connectivity.minConnections, connectionCount);
    analysis.connectivity.maxConnections = Math.max(analysis.connectivity.maxConnections, connectionCount);
    
    // Distribution
    if (!analysis.connectivity.connectionDistribution[connectionCount]) {
      analysis.connectivity.connectionDistribution[connectionCount] = 0;
    }
    analysis.connectivity.connectionDistribution[connectionCount]++;
    
    // Check for orphans (no parent and not "Thing")
    if (!wordData.parent && wordName !== 'Thing') {
      analysis.connectivity.orphanedWords.push(wordName);
    }
    
    // Relationship stats
    if (wordData.children && wordData.children.length > 0) {
      wordsWithChildren++;
      totalChildren += wordData.children.length;
    }
    totalTraits += (wordData.traits || []).length;
    totalAcquaintances += (wordData.acquaintances || []).length;
    
    // Flag empty relationships
    if (connectionCount === 0 || (connectionCount === 1 && wordData.parent)) {
      analysis.relationships.emptyRelationships.push(wordName);
    }
    
    // Collect examples
    if (connectionCount >= 8) {
      analysis.examples.wellConnected.push({
        word: wordName,
        connections: connectionCount,
        breakdown: {
          parent: wordData.parent || null,
          children: (wordData.children || []).length,
          traits: (wordData.traits || []).length,
          acquaintances: (wordData.acquaintances || []).length,
          purposes: (wordData.purposes || []).length
        }
      });
    }
    
    if (connectionCount <= 2 && wordName !== 'Thing') {
      analysis.examples.poorlyConnected.push({
        word: wordName,
        connections: connectionCount,
        parent: wordData.parent
      });
    }
  }
  
  // Calculate averages
  const wordCount = Object.keys(unified.master_words).length;
  analysis.connectivity.averageConnections = (totalConnections / wordCount).toFixed(2);
  analysis.relationships.averageChildren = wordsWithChildren > 0 ? 
    (totalChildren / wordsWithChildren).toFixed(2) : 0;
  analysis.relationships.averageTraits = (totalTraits / wordCount).toFixed(2);
  analysis.relationships.averageAcquaintances = (totalAcquaintances / wordCount).toFixed(2);
  
  // Find interesting paths
  if (unified.game_config && unified.game_config.daily_puzzle) {
    const { origin, destination } = unified.game_config.daily_puzzle;
    analysis.examples.puzzle = {
      origin,
      destination,
      suggestedLength: unified.game_config.daily_puzzle.optimal_path_length
    };
  }
  
  // Display analysis
  console.log('STRUCTURAL ANALYSIS:');
  console.log(`Total Nodes: ${analysis.structural.totalNodes}`);
  console.log(`- Thing Words: ${analysis.structural.thingWords}`);
  console.log(`- Trait Words: ${analysis.structural.traitWords}`);
  console.log(`- Role Words: ${analysis.structural.roleWords}`);
  console.log('');
  
  console.log('CONNECTIVITY ANALYSIS:');
  console.log(`Average Connections: ${analysis.connectivity.averageConnections}`);
  console.log(`Connection Range: ${analysis.connectivity.minConnections} - ${analysis.connectivity.maxConnections}`);
  console.log(`Orphaned Words: ${analysis.connectivity.orphanedWords.length}`);
  if (analysis.connectivity.orphanedWords.length > 0) {
    console.log(`  ${analysis.connectivity.orphanedWords.join(', ')}`);
  }
  console.log('');
  
  console.log('Connection Distribution:');
  Object.entries(analysis.connectivity.connectionDistribution)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([count, words]) => {
      console.log(`  ${count} connections: ${words} words`);
    });
  console.log('');
  
  console.log('RELATIONSHIP ANALYSIS:');
  console.log(`Average Children (for parents): ${analysis.relationships.averageChildren}`);
  console.log(`Average Traits: ${analysis.relationships.averageTraits}`);
  console.log(`Average Acquaintances: ${analysis.relationships.averageAcquaintances}`);
  console.log(`Empty/Minimal Relationships: ${analysis.relationships.emptyRelationships.length}`);
  console.log('');
  
  console.log('EXAMPLES:');
  console.log('Well-connected words:');
  analysis.examples.wellConnected.slice(0, 3).forEach(ex => {
    console.log(`  ${ex.word}: ${ex.connections} connections`);
    console.log(`    (${ex.breakdown.children} children, ${ex.breakdown.traits} traits, ${ex.breakdown.acquaintances} acquaintances)`);
  });
  console.log('');
  
  console.log('Poorly-connected words:');
  analysis.examples.poorlyConnected.slice(0, 5).forEach(ex => {
    console.log(`  ${ex.word}: ${ex.connections} connections (parent: ${ex.parent})`);
  });
  console.log('');
  
  if (analysis.examples.puzzle) {
    console.log('DAILY PUZZLE:');
    console.log(`  ${analysis.examples.puzzle.origin} → ${analysis.examples.puzzle.destination}`);
    console.log(`  Suggested length: ${analysis.examples.puzzle.suggestedLength} steps`);
  }
  
  // Save analysis
  const timestamp = new Date().toISOString().split('T')[0];
  const wordCountLabel = `${analysis.structural.thingWords}w`;
  const buildName = `build_${timestamp}_${wordCountLabel}`;
  const archivePath = path.join(ARCHIVE_DIR, buildName);
  
  console.log(`\nArchive this build? (y/n)`);
  
  return { analysis, buildName, archivePath };
}

// Run analyzer
analyzeBuild().catch(console.error);