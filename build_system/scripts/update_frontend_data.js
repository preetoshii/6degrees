#!/usr/bin/env node
/**
 * Updates frontend data with the latest build
 * Uses unified_master.json if available, otherwise creates a minimal version from master_words.json
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const FRONTEND_DATA = path.join(DATA_DIR, 'dummy_data.json');

async function updateFrontendData() {
  try {
    // First try to use unified_master.json
    const unifiedPath = path.join(DATA_DIR, 'processed/unified_master.json');
    try {
      const unified = await fs.readFile(unifiedPath, 'utf-8');
      const data = JSON.parse(unified);
      
      // Add timestamp to the data
      data.buildInfo = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      };
      
      // Write to dummy_data.json
      await fs.writeFile(FRONTEND_DATA, JSON.stringify(data, null, 2));
      console.log('✅ Updated frontend data from unified_master.json');
      console.log(`   Total words: ${Object.keys(data.master_words).length}`);
      return;
    } catch (e) {
      console.log('No unified_master.json found, creating from master_words.json...');
    }
    
    // Fallback: create minimal structure from master_words.json
    const masterPath = path.join(DATA_DIR, 'processed/master_words.json');
    const masterData = await fs.readFile(masterPath, 'utf-8');
    const masterWords = JSON.parse(masterData);
    
    // Convert array to object format
    const wordMap = {};
    for (const word of masterWords) {
      wordMap[word.word] = word;
    }
    
    // Create minimal unified structure
    const minimalData = {
      master_words: wordMap,
      traits_master: {},
      roles_master: {},
      stats: {
        total_words: masterWords.length,
        thing_words: masterWords.length,
        trait_words: 0,
        role_words: 0,
        total_nodes: masterWords.length
      }
    };
    
    // Try to load traits if available
    try {
      const traitsPath = path.join(DATA_DIR, 'processed/traits_master.json');
      const traitsData = await fs.readFile(traitsPath, 'utf-8');
      minimalData.traits_master = JSON.parse(traitsData);
      minimalData.stats.trait_words = Object.keys(minimalData.traits_master).length;
      minimalData.stats.total_nodes += minimalData.stats.trait_words;
    } catch (e) {
      // No traits file
    }
    
    // Try to load roles if available
    try {
      const rolesPath = path.join(DATA_DIR, 'processed/roles_master.json');
      const rolesData = await fs.readFile(rolesPath, 'utf-8');
      minimalData.roles_master = JSON.parse(rolesData);
      minimalData.stats.role_words = Object.keys(minimalData.roles_master).length;
      minimalData.stats.total_nodes += minimalData.stats.role_words;
    } catch (e) {
      // No roles file
    }
    
    // Add timestamp
    minimalData.buildInfo = {
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
    
    // Write to dummy_data.json
    await fs.writeFile(FRONTEND_DATA, JSON.stringify(minimalData, null, 2));
    console.log('✅ Created frontend data from master_words.json');
    console.log(`   Total words: ${masterWords.length}`);
    console.log(`   Total traits: ${minimalData.stats.trait_words}`);
    console.log(`   Total roles: ${minimalData.stats.role_words}`);
    
  } catch (error) {
    console.error('❌ Failed to update frontend data:', error.message);
    
    // Create a minimal working file if nothing exists
    const fallbackData = {
      master_words: {
        "Thing": {
          word: "Thing",
          type: "thing",
          parent: null,
          children: ["Animal", "Object"],
          traits: [],
          acquaintances: [],
          purposes: []
        },
        "Animal": {
          word: "Animal",
          type: "thing", 
          parent: "Thing",
          children: [],
          traits: [],
          acquaintances: [],
          purposes: []
        },
        "Object": {
          word: "Object",
          type: "thing",
          parent: "Thing", 
          children: [],
          traits: [],
          acquaintances: [],
          purposes: []
        }
      },
      traits_master: {},
      roles_master: {},
      stats: {
        total_words: 3,
        thing_words: 3,
        trait_words: 0,
        role_words: 0,
        total_nodes: 3
      }
    };
    
    // Add timestamp
    fallbackData.buildInfo = {
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric', 
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
    
    await fs.writeFile(FRONTEND_DATA, JSON.stringify(fallbackData, null, 2));
    console.log('⚠️  Created minimal fallback data for frontend');
  }
}

updateFrontendData().catch(console.error);