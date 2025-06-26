import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const ARCHIVE_DIR = path.join(DATA_DIR, 'archive');

/**
 * Archive a build with all its data and metadata
 * @param {Object} options - Archive options
 * @param {boolean} options.success - Whether build succeeded
 * @param {string} options.errorDetails - Error details if failed
 * @param {string} options.configFile - Config file used
 * @param {Object} options.stats - Build statistics
 * @returns {Promise<string>} Archive directory name
 */
export async function archiveBuild(options = {}) {
  const {
    success = true,
    errorDetails = '',
    configFile = 'unknown',
    stats = {}
  } = options;
  
  // Get word count
  let wordCount = 0;
  let hasUnified = false;
  
  try {
    const unified = await fs.readFile(
      path.join(DATA_DIR, 'processed/unified_master.json'),
      'utf-8'
    );
    const data = JSON.parse(unified);
    wordCount = data.stats.thing_words;
    hasUnified = true;
  } catch (e) {
    // Try master_words.json
    try {
      const master = await fs.readFile(
        path.join(DATA_DIR, 'processed/master_words.json'),
        'utf-8'
      );
      const words = JSON.parse(master);
      wordCount = words.length;
    } catch (e2) {
      wordCount = 0;
    }
  }
  
  // Create archive directory name
  const timestamp = new Date().toISOString().split('T')[0];
  const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
  const status = success ? 'success' : 'failed';
  const buildName = `build_${timestamp}_${time}_${wordCount}w_${status}`;
  const archivePath = path.join(ARCHIVE_DIR, buildName);
  
  // Create archive directory
  await fs.mkdir(archivePath, { recursive: true });
  
  // Copy all available files
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
  
  // Copy config if it exists
  if (configFile && configFile !== 'unknown') {
    try {
      const configPath = path.join(__dirname, '..', configFile);
      await fs.copyFile(
        configPath,
        path.join(archivePath, 'config_used.json')
      );
    } catch (e) {
      // Config not found
    }
  }
  
  // Create build status file
  const statusContent = {
    build_date: new Date().toISOString(),
    success: success,
    words_built: wordCount,
    has_unified: hasUnified,
    error: errorDetails,
    stats: stats,
    config_file: configFile
  };
  
  await fs.writeFile(
    path.join(archivePath, 'build_status.json'),
    JSON.stringify(statusContent, null, 2)
  );
  
  // Create analysis markdown
  const analysisContent = `# Build Analysis - ${timestamp}

## Build Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}

- **Date**: ${new Date().toISOString()}
- **Config**: ${configFile}
- **Words Built**: ${wordCount}
- **Unified Index**: ${hasUnified ? 'Yes' : 'No'}

${!success ? `## Failure Reason\n${errorDetails}\n` : ''}

## Build Statistics
\`\`\`json
${JSON.stringify(stats, null, 2)}
\`\`\`

## Automated Analysis
${hasUnified ? 'Run `npm run analyze` on this archive for detailed analysis.' : 'Build incomplete - no unified index for analysis.'}

## Manual Notes
(Add your observations here)
`;
  
  await fs.writeFile(
    path.join(archivePath, 'build_analysis.md'),
    analysisContent
  );
  
  console.log(`\n📦 Build archived to: ${buildName}`);
  
  return buildName;
}