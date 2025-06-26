#!/usr/bin/env node
/**
 * Run build asynchronously and report status
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATUS_FILE = path.join(__dirname, '../.build_status.json');

async function runBuildAsync(configFile = 'config/test-25.json') {
  console.log('=== Starting Async Build ===');
  console.log(`Config: ${configFile}`);
  console.log(`Status file: ${STATUS_FILE}`);
  console.log('\nBuild will run in background.');
  console.log('Check status with: npm run build:status\n');
  
  // Update status file
  await fs.writeFile(STATUS_FILE, JSON.stringify({
    status: 'running',
    startTime: new Date().toISOString(),
    config: configFile,
    pid: process.pid
  }, null, 2));
  
  // Spawn build process
  const buildProcess = spawn('node', ['index.js', '--config', configFile], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Capture output
  const logFile = path.join(__dirname, '../.build_output.log');
  const logStream = await fs.open(logFile, 'w');
  
  buildProcess.stdout.on('data', (data) => {
    logStream.write(data);
    process.stdout.write(data);
  });
  
  buildProcess.stderr.on('data', (data) => {
    logStream.write(data);
    process.stderr.write(data);
  });
  
  buildProcess.on('close', async (code) => {
    await logStream.close();
    
    // Update status
    await fs.writeFile(STATUS_FILE, JSON.stringify({
      status: code === 0 ? 'completed' : 'failed',
      exitCode: code,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      config: configFile
    }, null, 2));
    
    console.log(`\n✅ Build ${code === 0 ? 'completed' : 'failed'} with code ${code}`);
  });
  
  // Unref to allow parent to exit
  buildProcess.unref();
  
  console.log(`Build started with PID: ${buildProcess.pid}`);
  console.log('Parent process can now exit safely.');
}

// Run if called directly
const args = process.argv.slice(2);
const configFile = args[0] || 'config/test-25.json';
runBuildAsync(configFile).catch(console.error);