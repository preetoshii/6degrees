#!/usr/bin/env node
/**
 * Check current build status
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');

async function checkStatus() {
  console.log('=== Build Status ===\n');
  
  try {
    // Check for unified master
    const unifiedPath = path.join(DATA_DIR, 'processed/unified_master.json');
    try {
      const data = JSON.parse(await fs.readFile(unifiedPath, 'utf-8'));
      console.log('✅ Current Build:');
      console.log(`   Words: ${data.stats.total_words}`);
      console.log(`   Thing words: ${data.stats.thing_words}`);
      console.log(`   Trait words: ${data.stats.trait_words}`);
      console.log(`   Role words: ${data.stats.role_words}`);
      console.log(`   Build date: ${data.metadata.build_date}`);
    } catch (e) {
      console.log('❌ No complete build found');
    }
    
    // Check for partial data
    console.log('\n📁 Data Files:');
    const processedFiles = await fs.readdir(path.join(DATA_DIR, 'processed')).catch(() => []);
    const rawFiles = await fs.readdir(path.join(DATA_DIR, 'raw')).catch(() => []);
    
    console.log(`   Processed: ${processedFiles.filter(f => f !== '.gitkeep').join(', ') || 'none'}`);
    console.log(`   Raw: ${rawFiles.filter(f => f !== '.gitkeep').join(', ') || 'none'}`);
    
    // Check archives
    const archiveDir = path.join(DATA_DIR, 'archive');
    const archives = await fs.readdir(archiveDir).catch(() => []);
    console.log(`\n📦 Archives: ${archives.length} builds`);
    if (archives.length > 0) {
      console.log(`   Latest: ${archives.sort().reverse()[0]}`);
    }
    
  } catch (error) {
    console.error('Error checking status:', error);
  }
}

checkStatus();