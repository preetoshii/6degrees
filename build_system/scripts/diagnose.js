#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { readJSON, MASTER_WORDS_PATH, TRAITS_MASTER_PATH, ROLES_MASTER_PATH } from '../utils/file_utils.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function diagnose() {
  console.log('=== Six Degrees Build Diagnostics ===\n');

  // Check environment
  console.log('1. Environment Check:');
  console.log(`   - Node Version: ${process.version}`);
  console.log(`   - OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`   - Log Level: ${process.env.LOG_LEVEL || 'INFO'}`);
  console.log();

  // Check data files
  console.log('2. Data Files:');
  try {
    const masterWords = await readJSON(MASTER_WORDS_PATH) || [];
    console.log(`   - Master Words: ${masterWords.length} words`);
    
    if (masterWords.length > 0) {
      // Analyze word distribution
      const byParent = {};
      const byType = { thing: 0, trait: 0, role: 0 };
      let orphans = 0;
      let incomplete = 0;
      
      for (const word of masterWords) {
        byType[word.type || 'thing']++;
        
        if (!word.parent && word.word !== 'Thing') {
          orphans++;
        }
        
        if (!word.stages?.childrenDone || !word.stages?.rawLogged) {
          incomplete++;
        }
        
        const parent = word.parent || 'ROOT';
        byParent[parent] = (byParent[parent] || 0) + 1;
      }
      
      console.log(`     - By Type: Thing=${byType.thing}, Trait=${byType.trait}, Role=${byType.role}`);
      console.log(`     - Orphans: ${orphans}`);
      console.log(`     - Incomplete: ${incomplete}`);
      console.log(`     - Top Parents:`);
      
      const topParents = Object.entries(byParent)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      for (const [parent, count] of topParents) {
        console.log(`       - ${parent}: ${count} children`);
      }
    }
  } catch (error) {
    console.log(`   - Master Words: ✗ Error reading file`);
  }

  try {
    const traits = await readJSON(TRAITS_MASTER_PATH) || {};
    console.log(`   - Traits: ${Object.keys(traits).length} promoted`);
  } catch {
    console.log(`   - Traits: ✗ Not found`);
  }

  try {
    const roles = await readJSON(ROLES_MASTER_PATH) || {};
    console.log(`   - Roles: ${Object.keys(roles).length} promoted`);
  } catch {
    console.log(`   - Roles: ✗ Not found`);
  }
  console.log();

  // Check logs
  console.log('3. Recent Logs:');
  try {
    const logsDir = path.join(__dirname, '../../logs');
    const files = await fs.readdir(logsDir);
    const logFiles = files.filter(f => f.endsWith('.log')).sort().slice(-3);
    
    if (logFiles.length > 0) {
      console.log('   Recent log files:');
      for (const file of logFiles) {
        const stats = await fs.stat(path.join(logsDir, file));
        const size = (stats.size / 1024).toFixed(2);
        console.log(`   - ${file} (${size} KB)`);
      }
      
      // Check for recent errors
      const latestLog = path.join(logsDir, logFiles[logFiles.length - 1]);
      const content = await fs.readFile(latestLog, 'utf8');
      const errorLines = content.split('\n').filter(line => line.includes('[ERROR]'));
      
      if (errorLines.length > 0) {
        console.log(`\n   Recent errors in ${logFiles[logFiles.length - 1]}:`);
        errorLines.slice(-5).forEach(line => {
          const match = line.match(/\[ERROR\].*?(\w+.*)/);
          if (match) {
            console.log(`   - ${match[1].substring(0, 80)}...`);
          }
        });
      } else {
        console.log('   No errors found in latest log');
      }
    } else {
      console.log('   No log files found');
    }
  } catch (error) {
    console.log('   ✗ Could not read logs:', error.message);
  }
  console.log();

  // Check checkpoints
  console.log('4. Checkpoints:');
  try {
    const checkpointsDir = path.join(__dirname, '../../checkpoints');
    const files = await fs.readdir(checkpointsDir);
    const checkpointFiles = files.filter(f => f.endsWith('.json'));
    
    if (checkpointFiles.length > 0) {
      for (const file of checkpointFiles) {
        const checkpoint = await readJSON(path.join(checkpointsDir, file));
        const phase = file.match(/phase_(\w+)_/)?.[1] || 'unknown';
        console.log(`   - Phase ${phase}: ${checkpoint.phase_complete ? '✓ Complete' : '⟳ In Progress'}`);
        
        if (checkpoint.stats) {
          console.log(`     Stats:`, JSON.stringify(checkpoint.stats, null, 0).substring(0, 100) + '...');
        }
      }
    } else {
      console.log('   No checkpoints found');
    }
  } catch (error) {
    console.log('   ✗ Could not read checkpoints:', error.message);
  }
  console.log();

  // Recommendations
  console.log('5. Recommendations:');
  const issues = [];
  
  if (!process.env.OPENAI_API_KEY) {
    issues.push('Set OPENAI_API_KEY in .env file');
  }
  
  try {
    const masterWords = await readJSON(MASTER_WORDS_PATH) || [];
    if (masterWords.length === 0) {
      issues.push('No data found - run Phase 1 first');
    } else {
      const incomplete = masterWords.filter(w => !w.stages?.childrenDone || !w.stages?.rawLogged);
      if (incomplete.length > 0) {
        issues.push(`${incomplete.length} incomplete words - consider resuming Phase 1`);
      }
    }
  } catch {}
  
  if (issues.length > 0) {
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('   ✓ Everything looks good!');
  }
  
  console.log('\n=== End Diagnostics ===');
}

// Run diagnostics
diagnose().catch(console.error);