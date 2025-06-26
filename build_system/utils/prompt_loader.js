import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROMPTS_DIR = path.join(__dirname, '../prompts');

/**
 * Load a prompt template from file and substitute variables
 * @param {string} promptFile - Name of the prompt file (e.g., 'phase1_children.txt')
 * @param {Object} variables - Variables to substitute in the template
 * @returns {Promise<string>} The processed prompt
 */
export async function loadPrompt(promptFile, variables = {}) {
  try {
    const promptPath = path.join(PROMPTS_DIR, promptFile);
    let template = await fs.readFile(promptPath, 'utf-8');
    
    // Remove comments (lines starting with #)
    const lines = template.split('\n');
    const contentLines = lines.filter(line => !line.trim().startsWith('#'));
    template = contentLines.join('\n').trim();
    
    // Substitute variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, value);
    }
    
    return template;
  } catch (error) {
    console.error(`Error loading prompt ${promptFile}:`, error);
    throw error;
  }
}

/**
 * Get the system prompt for LLM calls
 * @returns {Promise<string>} The system prompt
 */
export async function getSystemPrompt() {
  return loadPrompt('system_prompt.txt');
}