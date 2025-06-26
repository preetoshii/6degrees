import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

class Logger {
  constructor(moduleName) {
    this.moduleName = moduleName;
    this.logLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'];
    this.logFile = null;
    this.initPromise = this.initialize();
  }

  async initialize() {
    // Ensure log directory exists
    await fs.mkdir(LOG_DIR, { recursive: true });
    
    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logFileName = `build_${timestamp}.log`;
    this.logFile = path.join(LOG_DIR, logFileName);
    
    // Write header
    await this.writeToFile(`=== Six Degrees Build Log ===\n`);
    await this.writeToFile(`Started: ${new Date().toISOString()}\n`);
    await this.writeToFile(`Module: ${this.moduleName}\n`);
    await this.writeToFile(`================================\n\n`);
  }

  async writeToFile(message) {
    try {
      await fs.appendFile(this.logFile, message);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.moduleName}]`;
    
    let fullMessage = `${prefix} ${message}`;
    
    if (data) {
      if (data instanceof Error) {
        fullMessage += `\n  Error: ${data.message}`;
        fullMessage += `\n  Stack: ${data.stack}`;
      } else if (typeof data === 'object') {
        fullMessage += `\n  Data: ${JSON.stringify(data, null, 2)}`;
      } else {
        fullMessage += `\n  Data: ${data}`;
      }
    }
    
    return fullMessage;
  }

  async log(level, message, data = null) {
    await this.initPromise; // Ensure initialization is complete
    
    const levelValue = LOG_LEVELS[level];
    if (levelValue > this.logLevel) return;
    
    const formattedMessage = this.formatMessage(level, message, data);
    
    // Write to console with color coding
    const consoleMessage = this.formatForConsole(level, message, data);
    switch (level) {
      case 'ERROR':
        console.error(consoleMessage);
        break;
      case 'WARN':
        console.warn(consoleMessage);
        break;
      default:
        console.log(consoleMessage);
    }
    
    // Write to file
    await this.writeToFile(formattedMessage + '\n\n');
  }

  formatForConsole(level, message, data) {
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[90m', // Gray
      TRACE: '\x1b[37m'  // White
    };
    const reset = '\x1b[0m';
    
    let output = `${colors[level]}[${level}]${reset} [${this.moduleName}] ${message}`;
    
    if (data && process.env.LOG_VERBOSE === 'true') {
      if (data instanceof Error) {
        output += `\n  ${colors.ERROR}${data.message}${reset}`;
      } else if (typeof data === 'object') {
        output += `\n  ${JSON.stringify(data, null, 2)}`;
      }
    }
    
    return output;
  }

  // Convenience methods
  async error(message, data) { await this.log('ERROR', message, data); }
  async warn(message, data) { await this.log('WARN', message, data); }
  async info(message, data) { await this.log('INFO', message, data); }
  async debug(message, data) { await this.log('DEBUG', message, data); }
  async trace(message, data) { await this.log('TRACE', message, data); }

  // Special methods for API tracking
  async logAPICall(endpoint, prompt, response, error = null) {
    const data = {
      endpoint,
      prompt: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
      response: response ? response.substring(0, 200) + (response.length > 200 ? '...' : '') : null,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    };
    
    if (error) {
      await this.error(`API call failed: ${endpoint}`, data);
    } else {
      await this.debug(`API call success: ${endpoint}`, data);
    }
  }

  // Progress tracking
  async logProgress(phase, current, total, message = '') {
    const percentage = ((current / total) * 100).toFixed(1);
    await this.info(`Phase ${phase} Progress: ${current}/${total} (${percentage}%)`, { message });
  }

  // Performance tracking
  async logPerformance(operation, duration, metadata = {}) {
    await this.debug(`Performance: ${operation} took ${duration}ms`, metadata);
  }

  // Get log file path
  getLogFile() {
    return this.logFile;
  }
}

// Export singleton instances for each module
export function createLogger(moduleName) {
  return new Logger(moduleName);
}

// Create a summary logger that writes to a separate file
export class SummaryLogger {
  constructor() {
    this.summaryFile = null;
    this.initPromise = this.initialize();
  }

  async initialize() {
    await fs.mkdir(LOG_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    this.summaryFile = path.join(LOG_DIR, `summary_${timestamp}.json`);
    
    await fs.writeFile(this.summaryFile, JSON.stringify({
      started: new Date().toISOString(),
      phases: {},
      errors: [],
      warnings: [],
      stats: {}
    }, null, 2));
  }

  async updateSummary(updates) {
    await this.initPromise;
    
    try {
      const current = JSON.parse(await fs.readFile(this.summaryFile, 'utf8'));
      const updated = { ...current, ...updates };
      await fs.writeFile(this.summaryFile, JSON.stringify(updated, null, 2));
    } catch (error) {
      console.error('Failed to update summary:', error);
    }
  }

  async logPhaseComplete(phase, stats) {
    const current = JSON.parse(await fs.readFile(this.summaryFile, 'utf8'));
    current.phases[phase] = {
      completed: new Date().toISOString(),
      stats
    };
    await fs.writeFile(this.summaryFile, JSON.stringify(current, null, 2));
  }

  async logError(phase, error) {
    const current = JSON.parse(await fs.readFile(this.summaryFile, 'utf8'));
    current.errors.push({
      phase,
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack
    });
    await fs.writeFile(this.summaryFile, JSON.stringify(current, null, 2));
  }

  getSummaryFile() {
    return this.summaryFile;
  }
}

export const summaryLogger = new SummaryLogger();