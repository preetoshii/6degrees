#!/usr/bin/env node
/**
 * List all archived builds with their status
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVE_DIR = path.join(__dirname, '../../data/archive');

async function listArchives() {
  console.log('=== Archived Builds ===\n');
  
  try {
    const archives = await fs.readdir(ARCHIVE_DIR);
    const builds = archives.filter(f => f.startsWith('build_'));
    
    if (builds.length === 0) {
      console.log('No archived builds found.');
      return;
    }
    
    // Sort by date (newest first)
    builds.sort().reverse();
    
    for (const build of builds) {
      const buildPath = path.join(ARCHIVE_DIR, build);
      
      // Parse build name
      const parts = build.split('_');
      const date = parts[1];
      const status = parts[parts.length - 1];
      
      console.log(`📦 ${build}`);
      console.log(`   Date: ${date}`);
      
      // Try to read build status
      try {
        const statusFile = await fs.readFile(
          path.join(buildPath, 'build_status.json'),
          'utf-8'
        );
        const status = JSON.parse(statusFile);
        
        console.log(`   Status: ${status.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`   Words: ${status.words_built}`);
        console.log(`   Unified: ${status.has_unified ? 'Yes' : 'No'}`);
        if (status.error) {
          console.log(`   Error: ${status.error}`);
        }
      } catch (e) {
        // Old format without status file
        try {
          const analysis = await fs.readFile(
            path.join(buildPath, 'build_analysis.md'),
            'utf-8'
          );
          if (analysis.includes('94w')) {
            console.log(`   Words: 94`);
            console.log(`   Status: Legacy build`);
          }
        } catch (e2) {
          console.log(`   Status: Unknown`);
        }
      }
      
      // List files
      const files = await fs.readdir(buildPath);
      console.log(`   Files: ${files.join(', ')}`);
      console.log('');
    }
    
    console.log(`Total archives: ${builds.length}`);
    
  } catch (error) {
    console.error('Error listing archives:', error);
  }
}

listArchives();