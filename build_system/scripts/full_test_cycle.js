#!/usr/bin/env node
/**
 * Full test cycle - Clean, Build, Test, Archive in one command
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const ARCHIVE_DIR = path.join(DATA_DIR, 'archive');

// Helper to run command
function runCommand(command, args = [], timeout = 600000) { // 10 minute default
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { 
      stdio: 'inherit',
      shell: true 
    });
    
    // Set timeout
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`${command} timed out after ${timeout/1000} seconds`));
    }, timeout);
    
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

// Helper to ask user
function askUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

async function fullTestCycle(configFile = 'config/test-25.json') {
  console.log('=== Six Degrees Full Test Cycle ===');
  console.log(`Config: ${configFile}\n`);
  
  let buildSuccess = false;
  let buildStats = {};
  let errorDetails = '';
  
  try {
    // 1. Clean
    console.log('📧 Step 1: Cleaning previous build...');
    await runCommand('node', ['scripts/clean_build.js']);
    
    // 2. Build
    console.log('\n🔨 Step 2: Running build...');
    try {
      await runCommand('node', ['index.js', '--config', configFile]);
      buildSuccess = true;
    } catch (buildError) {
      buildSuccess = false;
      errorDetails = buildError.message;
      console.error('⚠️  Build failed, continuing with analysis...');
    }
    
    // 3. Check what was built
    let hasUnified = false;
    let wordCount = 0;
    try {
      const unified = await fs.readFile(
        path.join(DATA_DIR, 'processed/unified_master.json'),
        'utf-8'
      );
      const data = JSON.parse(unified);
      buildStats = data.stats;
      wordCount = data.stats.thing_words;
      hasUnified = true;
    } catch (e) {
      // Try to get count from master_words.json
      try {
        const master = await fs.readFile(
          path.join(DATA_DIR, 'processed/master_words.json'),
          'utf-8'
        );
        const words = JSON.parse(master);
        wordCount = words.length;
        buildStats = { thing_words: wordCount, total_words: wordCount };
      } catch (e2) {
        wordCount = 0;
      }
    }
    
    // 4. Analyze if possible
    if (hasUnified) {
      console.log('\n📊 Step 3: Analyzing build...');
      try {
        await runCommand('node', ['scripts/analyze_build.js']);
      } catch (e) {
        console.log('⚠️  Analysis failed');
      }
      
      console.log('\n🧪 Step 4: Running semantic validation...');
      try {
        await runCommand('node', ['scripts/semantic_validator.js']);
      } catch (e) {
        console.log('⚠️  Validation failed');
      }
    } else {
      console.log('\n⚠️  Skipping analysis - no unified_master.json found');
    }
    
    // 5. ALWAYS Archive (successful or failed)
    const timestamp = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    const status = buildSuccess ? 'success' : 'failed';
    const buildName = `build_${timestamp}_${time}_${wordCount}w_${status}`;
    const archivePath = path.join(ARCHIVE_DIR, buildName);
    
    console.log(`\n💾 Auto-archiving ${status} build...`);
    await fs.mkdir(archivePath, { recursive: true });
    
    // Copy whatever files exist
    const filesToArchive = [
      'processed/unified_master.json',
      'processed/master_words.json',
      'processed/traits_master.json',
      'processed/roles_master.json',
      'raw/raw_traits.csv',
      'raw/raw_acquaintances.csv',
      'raw/raw_purposes.csv'
    ];
    
    for (const file of filesToArchive) {
      try {
        await fs.copyFile(
          path.join(DATA_DIR, file),
          path.join(archivePath, path.basename(file))
        );
      } catch (e) {
        // File doesn't exist, skip
      }
    }
    
    // Copy config
    await fs.copyFile(
      path.join(__dirname, '..', configFile),
      path.join(archivePath, 'config_used.json')
    );
    
    // Create build status file
    const statusContent = {
      build_date: new Date().toISOString(),
      success: buildSuccess,
      words_built: wordCount,
      has_unified: hasUnified,
      error: errorDetails,
      stats: buildStats
    };
    
    await fs.writeFile(
      path.join(archivePath, 'build_status.json'),
      JSON.stringify(statusContent, null, 2)
    );
    
    // Create analysis markdown
    const analysisContent = `# Build Analysis - ${timestamp}

## Build Status: ${buildSuccess ? '✅ SUCCESS' : '❌ FAILED'}

- **Date**: ${new Date().toISOString()}
- **Config**: ${configFile}
- **Words Built**: ${wordCount}
- **Unified Index**: ${hasUnified ? 'Yes' : 'No'}

${!buildSuccess ? `## Failure Reason\n${errorDetails}\n` : ''}

## Automated Analysis
${hasUnified ? 'See console output above for structural and semantic analysis.' : 'Build incomplete - no unified index for analysis.'}

## Manual Notes
(Add your observations here)
`;
    
    await fs.writeFile(
      path.join(archivePath, 'build_analysis.md'),
      analysisContent
    );
    
    console.log(`✅ Build archived to: ${buildName}`);
    
    // Update frontend data
    console.log('\n📱 Updating frontend data...');
    try {
      await runCommand('node', ['scripts/update_frontend_data.js']);
    } catch (e) {
      console.log('⚠️  Failed to update frontend data');
    }
    
    // 6. Summary
    console.log('\n=== Test Cycle Complete ===');
    console.log(`\nBuild Status: ${buildSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Words Built: ${wordCount}`);
    console.log(`Archived to: ${buildName}`);
    console.log('\nNext steps:');
    console.log('1. Review the analysis results above');
    console.log('2. Update prompts in prompts/ directory');
    console.log('3. Run another cycle: npm run test:cycle');
    
  } catch (error) {
    console.error('\n❌ Test cycle failed:', error.message);
    process.exit(1);
  }
}

// Parse command line args
const args = process.argv.slice(2);
const configFile = args[0] || 'config/test-25.json';

fullTestCycle(configFile).catch(console.error);