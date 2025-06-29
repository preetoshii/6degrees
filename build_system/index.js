#!/usr/bin/env node

import { readJSON } from './utils/file_utils.js';
import { runPhase1 } from './phases/phase1_tree_growth.js';
import { runPhase2 } from './phases/phase2_trait_normalization.js';
import { runPhase2_5 } from './phases/phase2_5_role_normalization.js';
import { runPhase3 } from './phases/phase3_acquaintance_adoption.js';
import { runPhase3_5 } from './phases/phase3_5_unified_index.js';
import { createLogger, summaryLogger } from './utils/logger.js';
import { monitor } from './utils/monitor.js';
import { archiveBuild } from './utils/archive_utils.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const logger = createLogger('Main');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATUS_FILE = path.join(__dirname, '.build_status.json');

// Status tracking functions
async function writeStatus(status, config = null, error = null) {
  const statusData = {
    status,
    startTime: status === 'running' ? new Date().toISOString() : (await readStatus())?.startTime,
    endTime: ['completed', 'failed'].includes(status) ? new Date().toISOString() : null,
    config: config || (await readStatus())?.config,
    targetWords: config ? (await readJSON(config))?.targetWordCount : null,
    error: error || null,
    exitCode: null
  };
  
  await fs.writeFile(STATUS_FILE, JSON.stringify(statusData, null, 2));
}

async function readStatus() {
  try {
    const data = await fs.readFile(STATUS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    config: path.join(__dirname, 'config/test-sample.json'),
    phases: null,
    help: false,
    noArchive: false
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--config':
      case '-c':
        options.config = args[++i];
        break;
      case '--phases':
      case '-p':
        options.phases = args[++i].split(',').map(p => p.trim());
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--no-archive':
        options.noArchive = true;
        break;
    }
  }
  
  return options;
}

// Show help
function showHelp() {
  console.log(`
Six Degrees Build System

Usage: node index.js [options]

Options:
  --config, -c <path>     Config file path (default: config/test-sample.json)
  --phases, -p <phases>   Comma-separated list of phases to run (default: all enabled in config)
  --no-archive            Disable automatic archiving after build
  --help, -h              Show this help message

Examples:
  node index.js --config config/full-run.json
  node index.js --phases 1,2
  node index.js -c config/test-sample.json -p 1

Available phases:
  1    - Core Tree Growth
  2    - Trait Normalization
  2.5  - Role Normalization
  3    - Acquaintance Adoption
  3.5  - Unified Index
  `);
}

// Main execution
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  await logger.info('=== Six Degrees Build System Starting ===');
  
  // Initialize status tracking
  await writeStatus('running', options.config);
  
  // Load config
  const config = await readJSON(options.config);
  if (!config) {
    await logger.error(`Config file not found: ${options.config}`);
    console.error(`Config file not found: ${options.config}`);
    process.exit(1);
  }
  
  // Store options in config for later use
  config.configFile = options.config;
  config.noArchive = options.noArchive;
  
  await logger.info('Configuration loaded', {
    configFile: options.config,
    targetWordCount: config.targetWordCount,
    dryRun: config.dryRun,
    phases: config.phases
  });
  
  console.log('Starting Six Degrees Build System');
  console.log(`Config: ${options.config}`);
  console.log(`Target word count: ${config.targetWordCount}`);
  console.log(`Log file: ${logger.getLogFile()}`);
  console.log('');
  
  // Determine which phases to run
  const phasesToRun = options.phases || 
    Object.entries(config.phases)
      .filter(([_, enabled]) => enabled)
      .map(([phase, _]) => phase.replace('phase', ''));
  
  const startTime = Date.now();
  
  try {
    // Run phases in order
    if (phasesToRun.includes('1')) {
      await logger.info('Starting Phase 1');
      await runPhase1(config);
      await summaryLogger.logPhaseComplete('phase1', monitor.stats.phase1);
      console.log('');
    }
    
    if (phasesToRun.includes('2')) {
      await runPhase2(config);
      console.log('');
    }
    
    if (phasesToRun.includes('2_5') || phasesToRun.includes('2.5')) {
      await runPhase2_5(config);
      console.log('');
    }
    
    if (phasesToRun.includes('3')) {
      await runPhase3(config);
      console.log('');
    }
    
    if (phasesToRun.includes('3_5') || phasesToRun.includes('3.5')) {
      await runPhase3_5(config);
      console.log('');
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Build complete in ${duration} seconds`);
    
    // Display final report
    monitor.displayProgress();
    const finalReport = await monitor.saveReport();
    
    await logger.info('=== Build Complete ===', finalReport);
    console.log(`\nFull logs available at: ${logger.getLogFile()}`);
    console.log(`Summary available at: ${summaryLogger.getSummaryFile()}`);
    
    // Auto-archive successful build (unless disabled)
    if (!config.noArchive) {
      const archiveName = await archiveBuild({
        success: true,
        configFile: config.configFile || 'custom',
        stats: finalReport
      });
      console.log(`\n✅ Build automatically archived: ${archiveName}`);
    }
    
    // Mark as completed
    await writeStatus('completed');
    
  } catch (error) {
    await logger.error('Build failed', error);
    await summaryLogger.logError('main', error);
    console.error('Build failed:', error);
    console.log(`\nCheck logs for details: ${logger.getLogFile()}`);
    
    // Auto-archive failed build (unless disabled)
    if (!config.noArchive) {
      try {
        const archiveName = await archiveBuild({
          success: false,
          errorDetails: error.message || 'Unknown error',
          configFile: config.configFile || 'custom',
          stats: monitor.getStats()
        });
        console.log(`\n❌ Failed build automatically archived: ${archiveName}`);
      } catch (archiveError) {
        console.error('Failed to archive build:', archiveError.message);
      }
    }
    
    // Mark as failed
    await writeStatus('failed', null, error.message);
    process.exit(1);
  }
}

// Run
main();