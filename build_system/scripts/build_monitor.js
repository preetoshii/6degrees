#!/usr/bin/env node
/**
 * Build Progress Monitor - Shows real-time build progress
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATUS_FILE = path.join(__dirname, '../.build_status.json');
const LOG_FILE = path.join(__dirname, '../.build_output.log');

let lastLogSize = 0;
let monitoring = false;

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[0f');
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function displayStatus() {
  try {
    clearScreen();
    console.log('🔨 Six Degrees Build Monitor');
    console.log('═'.repeat(50));
    
    // Read status
    try {
      const statusData = await fs.readFile(STATUS_FILE, 'utf-8');
      const status = JSON.parse(statusData);
      
      const startTime = new Date(status.startTime);
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / 1000);
      
      console.log(`📊 Status: ${status.status.toUpperCase()}`);
      console.log(`⚙️  Config: ${status.config}`);
      console.log(`⏱️  Elapsed: ${formatTime(elapsed)}`);
      console.log(`🎯 Target: ${status.targetWords || 'unknown'} words`);
      
      if (status.status === 'completed') {
        console.log(`✅ Completed at: ${status.endTime}`);
        console.log(`📤 Exit Code: ${status.exitCode}`);
      } else if (status.status === 'failed') {
        console.log(`❌ Failed at: ${status.endTime}`);
        console.log(`📤 Exit Code: ${status.exitCode}`);
        if (status.error) {
          console.log(`💥 Error: ${status.error}`);
        }
      }
      
    } catch (e) {
      console.log('⚠️  No build currently running');
      return false;
    }
    
    console.log('');
    console.log('📋 Recent Log Output:');
    console.log('─'.repeat(50));
    
    // Show streaming log
    try {
      const logData = await fs.readFile(LOG_FILE, 'utf-8');
      const lines = logData.split('\n').filter(line => line.trim());
      
      // Show last 15 lines
      const recentLines = lines.slice(-15);
      recentLines.forEach(line => {
        // Color-code log levels
        if (line.includes('[ERROR]')) {
          console.log(`🔴 ${line}`);
        } else if (line.includes('[WARN]')) {
          console.log(`🟡 ${line}`);
        } else if (line.includes('Progress:') || line.includes('Phase')) {
          console.log(`🔵 ${line}`);
        } else if (line.includes('complete') || line.includes('✅')) {
          console.log(`🟢 ${line}`);
        } else {
          console.log(`   ${line}`);
        }
      });
      
      // Show if log is growing
      const currentSize = logData.length;
      if (currentSize > lastLogSize) {
        console.log(`📈 Log is actively growing (+${currentSize - lastLogSize} chars)`);
      } else if (monitoring) {
        console.log(`⏸️  Log unchanged for ${Math.floor(Date.now() / 1000) % 60}s`);
      }
      lastLogSize = currentSize;
      
    } catch (e) {
      console.log('📋 No log file found');
    }
    
    console.log('');
    console.log('Press Ctrl+C to stop monitoring');
    return true;
    
  } catch (error) {
    console.error('Monitor error:', error.message);
    return false;
  }
}

async function monitor() {
  monitoring = true;
  console.log('🚀 Starting build monitor...');
  
  // Initial display
  const hasStatus = await displayStatus();
  
  if (!hasStatus) {
    console.log('No active build to monitor. Run a build first.');
    process.exit(0);
  }
  
  // Update every 2 seconds
  const interval = setInterval(async () => {
    const stillActive = await displayStatus();
    if (!stillActive) {
      console.log('Build completed or monitor stopped.');
      clearInterval(interval);
      process.exit(0);
    }
  }, 2000);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n👋 Monitor stopped');
    process.exit(0);
  });
}

// Handle command line usage
if (process.argv[2] === '--once') {
  displayStatus().then(() => process.exit(0));
} else {
  monitor();
}