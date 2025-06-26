#!/usr/bin/env node
/**
 * Clean build script - ensures fresh start for each build
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const PROCESSED_DIR = path.join(DATA_DIR, 'processed');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const CHECKPOINTS_DIR = path.join(DATA_DIR, 'checkpoints');

async function cleanBuild() {
  console.log('=== Cleaning Build Environment ===\n');
  
  try {
    // 1. Clean processed directory
    console.log('Cleaning processed data...');
    const processedFiles = await fs.readdir(PROCESSED_DIR).catch(() => []);
    for (const file of processedFiles) {
      if (file !== '.gitkeep') {
        await fs.unlink(path.join(PROCESSED_DIR, file));
        console.log(`  ✓ Removed ${file}`);
      }
    }
    
    // 2. Clean raw directory
    console.log('\nCleaning raw data...');
    const rawFiles = await fs.readdir(RAW_DIR).catch(() => []);
    for (const file of rawFiles) {
      if (file !== '.gitkeep') {
        await fs.unlink(path.join(RAW_DIR, file));
        console.log(`  ✓ Removed ${file}`);
      }
    }
    
    // 3. Clean checkpoints
    console.log('\nCleaning checkpoints...');
    const checkpointFiles = await fs.readdir(CHECKPOINTS_DIR).catch(() => []);
    for (const file of checkpointFiles) {
      if (file !== '.gitkeep') {
        await fs.unlink(path.join(CHECKPOINTS_DIR, file));
        console.log(`  ✓ Removed ${file}`);
      }
    }
    
    console.log('\n✅ Build environment cleaned successfully!');
    console.log('Ready for fresh build.\n');
    
  } catch (error) {
    console.error('Error cleaning build:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanBuild();
}

export { cleanBuild };