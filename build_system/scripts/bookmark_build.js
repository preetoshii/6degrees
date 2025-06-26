#!/usr/bin/env node
/**
 * Bookmark a build by renaming it with "BOOKMARK" suffix
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVE_DIR = path.join(__dirname, '../../data/archive');

async function bookmarkBuild(buildName, description = '') {
  console.log('=== Six Degrees Build Bookmarker ===\n');
  
  try {
    // Find the build directory
    const archives = await fs.readdir(ARCHIVE_DIR);
    const matchingBuilds = archives.filter(f => f.includes(buildName));
    
    if (matchingBuilds.length === 0) {
      console.log(`❌ No build found matching: ${buildName}`);
      console.log('\nAvailable builds:');
      const builds = archives.filter(f => f.startsWith('build_'));
      builds.forEach(build => console.log(`  ${build}`));
      return;
    }
    
    if (matchingBuilds.length > 1) {
      console.log(`❌ Multiple builds found matching: ${buildName}`);
      matchingBuilds.forEach(build => console.log(`  ${build}`));
      return;
    }
    
    const originalBuild = matchingBuilds[0];
    const originalPath = path.join(ARCHIVE_DIR, originalBuild);
    
    // Check if already bookmarked
    if (originalBuild.includes('BOOKMARK')) {
      console.log(`❌ Build ${originalBuild} is already bookmarked!`);
      return;
    }
    
    // Create new name with bookmark
    let newBuildName;
    if (description) {
      // Replace spaces with dashes and remove special chars
      const cleanDesc = description.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
      newBuildName = originalBuild.replace(/_success$|_timeout$|_failed$/, `_BOOKMARK-${cleanDesc}`);
    } else {
      newBuildName = originalBuild.replace(/_success$|_timeout$|_failed$/, '_BOOKMARK');
    }
    
    const newPath = path.join(ARCHIVE_DIR, newBuildName);
    
    // Rename the directory
    await fs.rename(originalPath, newPath);
    
    // Update build_status.json if it exists
    try {
      const statusPath = path.join(newPath, 'build_status.json');
      const statusData = await fs.readFile(statusPath, 'utf-8');
      const status = JSON.parse(statusData);
      status.bookmarked = true;
      status.bookmark_description = description || 'Bookmarked build';
      status.bookmark_date = new Date().toISOString();
      await fs.writeFile(statusPath, JSON.stringify(status, null, 2));
    } catch (e) {
      // Status file doesn't exist, that's okay
    }
    
    console.log(`✅ Successfully bookmarked build!`);
    console.log(`   Original: ${originalBuild}`);
    console.log(`   New name: ${newBuildName}`);
    if (description) {
      console.log(`   Description: ${description}`);
    }
    
  } catch (error) {
    console.error('❌ Error bookmarking build:', error);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: npm run bookmark <build-identifier> [description]');
  console.log('');
  console.log('Examples:');
  console.log('  npm run bookmark 21-58-08');
  console.log('  npm run bookmark 21-58-08 "good-traits-before-clustering"');
  console.log('  npm run bookmark success "working-build"');
  process.exit(1);
}

const buildIdentifier = args[0];
const description = args.slice(1).join(' ');

bookmarkBuild(buildIdentifier, description);