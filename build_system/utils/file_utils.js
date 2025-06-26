import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.join(__dirname, '../../data');
export const PROCESSED_DIR = path.join(DATA_DIR, 'processed');
export const RAW_DIR = path.join(DATA_DIR, 'raw');
export const CHECKPOINT_DIR = path.join(__dirname, '../../checkpoints');

// File paths
export const MASTER_WORDS_PATH = path.join(PROCESSED_DIR, 'master_words.json');
export const TRAITS_MASTER_PATH = path.join(PROCESSED_DIR, 'traits_master.json');
export const ROLES_MASTER_PATH = path.join(PROCESSED_DIR, 'roles_master.json');
export const UNIFIED_MASTER_PATH = path.join(PROCESSED_DIR, 'unified_master.json');

export const RAW_TRAITS_PATH = path.join(RAW_DIR, 'raw_traits.csv');
export const RAW_ACQUAINTANCES_PATH = path.join(RAW_DIR, 'raw_acquaintances.csv');
export const RAW_PURPOSES_PATH = path.join(RAW_DIR, 'raw_purposes.csv');

// Ensure directories exist
export async function ensureDirectories() {
  await fs.mkdir(PROCESSED_DIR, { recursive: true });
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(CHECKPOINT_DIR, { recursive: true });
}

// Read JSON file with error handling
export async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    throw error;
  }
}

// Write JSON file with atomic write
export async function writeJSON(filePath, data, pretty = true) {
  const tempPath = `${filePath}.tmp`;
  const content = pretty 
    ? JSON.stringify(data, null, 2) 
    : JSON.stringify(data);
  
  await fs.writeFile(tempPath, content, 'utf8');
  await fs.rename(tempPath, filePath);
}

// Append to CSV file
export async function appendToCSV(filePath, rows) {
  const content = rows.map(row => row.join(',')).join('\n') + '\n';
  await fs.appendFile(filePath, content, 'utf8');
}

// Read CSV file
export async function readCSV(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.trim().split('\n');
    return lines.map(line => line.split(','));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Create backup
export async function createBackup(filePath) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupPath = `${filePath}.backup.${timestamp}`;
  
  try {
    await fs.copyFile(filePath, backupPath);
    return backupPath;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    return null;
  }
}

// Checkpoint management
export async function saveCheckpoint(phase, data) {
  const checkpointPath = path.join(CHECKPOINT_DIR, `phase_${phase}_checkpoint.json`);
  const checkpoint = {
    checkpoint_version: '1.0',
    timestamp: new Date().toISOString(),
    phase,
    data,
    stats: {
      words_processed: data.words_processed || 0,
      errors_encountered: data.errors_encountered || 0,
      api_calls_made: data.api_calls_made || 0
    }
  };
  
  await writeJSON(checkpointPath, checkpoint);
  return checkpointPath;
}

export async function loadCheckpoint(phase) {
  const checkpointPath = path.join(CHECKPOINT_DIR, `phase_${phase}_checkpoint.json`);
  return await readJSON(checkpointPath);
}