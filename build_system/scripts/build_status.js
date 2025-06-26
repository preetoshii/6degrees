#!/usr/bin/env node
/**
 * Check status of async build
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATUS_FILE = path.join(__dirname, '../.build_status.json');
const LOG_FILE = path.join(__dirname, '../.build_output.log');

async function checkBuildStatus() {
  try {
    // Read status
    const statusData = await fs.readFile(STATUS_FILE, 'utf-8');
    const status = JSON.parse(statusData);
    
    console.log('=== Build Status ===');
    console.log(`Status: ${status.status.toUpperCase()}`);
    console.log(`Config: ${status.config}`);
    console.log(`Started: ${status.startTime}`);
    
    if (status.status === 'completed' || status.status === 'failed') {
      console.log(`Ended: ${status.endTime}`);
      console.log(`Exit Code: ${status.exitCode}`);
    }
    
    // Show last few lines of log
    try {
      const log = await fs.readFile(LOG_FILE, 'utf-8');
      const lines = log.trim().split('\n');
      const lastLines = lines.slice(-10);
      
      console.log('\n=== Last 10 Log Lines ===');
      lastLines.forEach(line => console.log(line));
    } catch (e) {
      // No log file yet
    }
    
  } catch (error) {
    console.log('No build currently running or status file not found.');
  }
}

checkBuildStatus();