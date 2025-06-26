#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { readJSON } from '../utils/file_utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');

// Semantic validation rules based on GDD analysis
class SemanticValidator {
  constructor(unified) {
    this.unified = unified;
    this.masterWords = unified.master_words;
    this.failures = [];
    this.warnings = [];
    this.stats = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  // Main validation runner
  async validate() {
    console.log('=== Six Degrees Semantic Validator ===\n');
    
    // 1. Thing Word Tests
    await this.validateThingWords();
    
    // 2. Trait Tests
    await this.validateTraits();
    
    // 3. Role Tests
    await this.validateRoles();
    
    // 4. Cross-Type Tests
    await this.validateCrossType();
    
    // 5. Critical Issues
    await this.checkCriticalIssues();
    
    // Report results
    this.reportResults();
  }
  
  // 1. THING WORD SEMANTIC TESTS
  async validateThingWords() {
    console.log('Validating Thing Words...');
    
    for (const [wordName, wordData] of Object.entries(this.masterWords)) {
      if (wordData.type !== 'thing') continue;
      
      // 1.1 Parent-Child Validity
      if (wordData.parent) {
        this.testParentChildValidity(wordName, wordData);
      }
      
      // 1.2 Sibling Consistency
      if (wordData.children && wordData.children.length > 0) {
        this.testSiblingConsistency(wordName, wordData);
      }
      
      // 1.3 Acquaintance Non-Overlap
      if (wordData.acquaintances) {
        this.testAcquaintanceValidity(wordName, wordData);
      }
      
      // 1.4 Metadata Completeness
      this.testMetadataCompleteness(wordName, wordData);
    }
  }
  
  testParentChildValidity(word, data) {
    this.stats.totalTests++;
    
    // Check for part-whole relationships (should be acquaintances)
    const partWholePatterns = ['wheel', 'engine', 'door', 'window', 'room'];
    const wordLower = word.toLowerCase();
    
    for (const pattern of partWholePatterns) {
      if (wordLower.includes(pattern) && data.parent !== 'Thing') {
        this.addFailure(
          `Part-Whole Relationship`,
          `"${word}" appears to be part of something, not a type of "${data.parent}"`
        );
        return;
      }
    }
    
    // Check for action/behavior words (should be roles)
    if (wordLower.endsWith('ing') && data.parent !== 'Thing') {
      this.addFailure(
        `Action as Thing`,
        `"${word}" appears to be an action/behavior, not a type of "${data.parent}"`
      );
      return;
    }
    
    this.stats.passed++;
  }
  
  testSiblingConsistency(word, data) {
    this.stats.totalTests++;
    
    const children = data.children;
    if (children.length < 2) {
      this.stats.passed++;
      return;
    }
    
    // Check if siblings are mixed types
    const childTypes = children.map(child => {
      const childData = this.masterWords[child];
      if (!childData) return 'unknown';
      
      // Simple heuristic for type detection
      if (child.endsWith('ing')) return 'action';
      if (childData.children && childData.children.length > 0) return 'category';
      return 'instance';
    });
    
    const uniqueTypes = [...new Set(childTypes)];
    if (uniqueTypes.length > 1 && !uniqueTypes.includes('unknown')) {
      this.addWarning(
        `Mixed Sibling Types`,
        `"${word}" has children of different types: ${children.join(', ')}`
      );
    } else {
      this.stats.passed++;
    }
  }
  
  testAcquaintanceValidity(word, data) {
    this.stats.totalTests++;
    let hasIssue = false;
    
    for (const acq of data.acquaintances) {
      // Check if acquaintance is placeholder
      if (acq.match(/^acquaintance\d+$/)) {
        this.addFailure(
          `Placeholder Acquaintance`,
          `"${word}" has placeholder acquaintance "${acq}"`
        );
        hasIssue = true;
        continue;
      }
      
      // Check if acquaintance is actually a child
      if (data.children && data.children.includes(acq)) {
        this.addFailure(
          `Child as Acquaintance`,
          `"${word}" has child "${acq}" listed as acquaintance`
        );
        hasIssue = true;
      }
      
      // Check if acquaintance is parent
      if (data.parent === acq) {
        this.addFailure(
          `Parent as Acquaintance`,
          `"${word}" has parent "${acq}" listed as acquaintance`
        );
        hasIssue = true;
      }
    }
    
    if (!hasIssue) this.stats.passed++;
  }
  
  testMetadataCompleteness(word, data) {
    this.stats.totalTests++;
    
    const expectedCounts = {
      traits: { min: 3, max: 5 },
      acquaintances: { min: 3, max: 5 }
    };
    
    // Check traits
    const traitCount = (data.traits || []).length;
    if (traitCount < expectedCounts.traits.min) {
      this.addFailure(
        `Insufficient Traits`,
        `"${word}" has ${traitCount} traits (expected ${expectedCounts.traits.min}-${expectedCounts.traits.max})`
      );
      return;
    }
    
    // Check acquaintances
    const acqCount = (data.acquaintances || []).length;
    if (acqCount < expectedCounts.acquaintances.min) {
      this.addFailure(
        `Insufficient Acquaintances`,
        `"${word}" has ${acqCount} acquaintances (expected ${expectedCounts.acquaintances.min}-${expectedCounts.acquaintances.max})`
      );
      return;
    }
    
    this.stats.passed++;
  }
  
  // 2. TRAIT TESTS
  async validateTraits() {
    console.log('Validating Traits...');
    
    // Check trait assignments
    for (const [word, data] of Object.entries(this.masterWords)) {
      if (data.traits) {
        for (const trait of data.traits) {
          this.testTraitValidity(word, trait);
        }
      }
    }
    
    // Check promoted traits
    if (this.unified.promoted_traits) {
      for (const trait of Object.keys(this.unified.promoted_traits)) {
        this.testPromotedTraitQuality(trait);
      }
    }
  }
  
  testTraitValidity(word, trait) {
    this.stats.totalTests++;
    
    // Check for placeholder
    if (trait.match(/^trait\d+$/)) {
      this.addFailure(
        `Placeholder Trait`,
        `"${word}" has placeholder trait "${trait}"`
      );
      return;
    }
    
    // Check if trait exists in promoted traits
    if (this.unified.promoted_traits && !this.unified.promoted_traits[trait]) {
      this.addWarning(
        `Unknown Trait`,
        `"${word}" has trait "${trait}" not in promoted traits`
      );
      return;
    }
    
    this.stats.passed++;
  }
  
  testPromotedTraitQuality(trait) {
    this.stats.totalTests++;
    
    const traitData = this.unified.promoted_traits[trait];
    if (!traitData || !traitData.exemplars) {
      this.addFailure(
        `Invalid Promoted Trait`,
        `Promoted trait "${trait}" has no exemplar data`
      );
      return;
    }
    
    // Check minimum exemplars
    if (traitData.exemplars.length < 3) {
      this.addFailure(
        `Insufficient Exemplars`,
        `Trait "${trait}" has only ${traitData.exemplars.length} exemplars (minimum 3 required)`
      );
      return;
    }
    
    this.stats.passed++;
  }
  
  // 3. ROLE TESTS
  async validateRoles() {
    console.log('Validating Roles...');
    
    // Check role assignments
    for (const [word, data] of Object.entries(this.masterWords)) {
      if (data.purposes) {
        for (const role of data.purposes) {
          this.testRoleValidity(word, role);
        }
      }
    }
  }
  
  testRoleValidity(word, role) {
    this.stats.totalTests++;
    
    // Check if role is gerund or functional noun
    const isGerund = role.endsWith('ing');
    const isFunctionalNoun = ['guardian', 'carrier', 'protector'].some(
      pattern => role.includes(pattern)
    );
    
    if (!isGerund && !isFunctionalNoun) {
      this.addWarning(
        `Questionable Role Format`,
        `Role "${role}" for "${word}" may not be in correct format`
      );
      return;
    }
    
    this.stats.passed++;
  }
  
  // 4. CROSS-TYPE TESTS
  async validateCrossType() {
    console.log('Validating Cross-Type Relationships...');
    
    // Reference integrity
    this.testReferenceIntegrity();
    
    // Connection density
    this.testConnectionDensity();
  }
  
  testReferenceIntegrity() {
    this.stats.totalTests++;
    let hasError = false;
    
    for (const [word, data] of Object.entries(this.masterWords)) {
      // Check parent reference
      if (data.parent && !this.masterWords[data.parent]) {
        this.addFailure(
          `Invalid Parent Reference`,
          `"${word}" references non-existent parent "${data.parent}"`
        );
        hasError = true;
      }
      
      // Check children references
      if (data.children) {
        for (const child of data.children) {
          if (!this.masterWords[child]) {
            this.addFailure(
              `Invalid Child Reference`,
              `"${word}" references non-existent child "${child}"`
            );
            hasError = true;
          }
        }
      }
    }
    
    if (!hasError) this.stats.passed++;
  }
  
  testConnectionDensity() {
    this.stats.totalTests++;
    
    let totalConnections = 0;
    let poorlyConnected = [];
    
    for (const [word, data] of Object.entries(this.masterWords)) {
      const connections = [
        ...(data.parent ? [data.parent] : []),
        ...(data.children || []),
        ...(data.traits || []),
        ...(data.acquaintances || []),
        ...(data.purposes || [])
      ].length;
      
      totalConnections += connections;
      
      if (connections < 4 && word !== 'Thing') {
        poorlyConnected.push({ word, connections });
      }
    }
    
    const avgConnections = totalConnections / Object.keys(this.masterWords).length;
    
    if (avgConnections < 4) {
      this.addFailure(
        `Low Connection Density`,
        `Average ${avgConnections.toFixed(2)} connections per word (expected 4-8)`
      );
    } else if (poorlyConnected.length > Object.keys(this.masterWords).length * 0.2) {
      this.addWarning(
        `Many Poorly Connected Words`,
        `${poorlyConnected.length} words have <4 connections (${(poorlyConnected.length / Object.keys(this.masterWords).length * 100).toFixed(0)}%)`
      );
    } else {
      this.stats.passed++;
    }
  }
  
  // 5. CRITICAL ISSUES
  async checkCriticalIssues() {
    console.log('Checking Critical Issues...');
    
    // Check for any placeholder data
    let placeholderCount = 0;
    
    for (const [word, data] of Object.entries(this.masterWords)) {
      const allValues = [
        ...(data.traits || []),
        ...(data.acquaintances || [])
      ];
      
      for (const val of allValues) {
        if (val.match(/^(trait|acquaintance)\d+$/)) {
          placeholderCount++;
        }
      }
    }
    
    if (placeholderCount > 0) {
      this.addFailure(
        `Critical: Placeholder Data`,
        `Found ${placeholderCount} placeholder values in dataset`
      );
    }
  }
  
  // Helper methods
  addFailure(test, message) {
    this.failures.push({ test, message });
    this.stats.failed++;
  }
  
  addWarning(test, message) {
    this.warnings.push({ test, message });
    this.stats.warnings++;
  }
  
  reportResults() {
    console.log('\n=== VALIDATION RESULTS ===\n');
    
    // Summary stats
    const passRate = (this.stats.passed / this.stats.totalTests * 100).toFixed(1);
    console.log(`Tests Run: ${this.stats.totalTests}`);
    console.log(`Passed: ${this.stats.passed} (${passRate}%)`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Warnings: ${this.stats.warnings}`);
    
    // Critical threshold
    const criticalTests = ['Placeholder', 'Reference Integrity', 'Metadata Completeness'];
    const criticalFailures = this.failures.filter(f => 
      criticalTests.some(t => f.test.includes(t))
    );
    
    if (criticalFailures.length > 0) {
      console.log('\n❌ CRITICAL FAILURES DETECTED:');
      criticalFailures.forEach(f => {
        console.log(`  - ${f.test}: ${f.message}`);
      });
    }
    
    // Other failures
    const otherFailures = this.failures.filter(f => 
      !criticalTests.some(t => f.test.includes(t))
    );
    
    if (otherFailures.length > 0) {
      console.log('\n⚠️  OTHER FAILURES:');
      otherFailures.slice(0, 10).forEach(f => {
        console.log(`  - ${f.test}: ${f.message}`);
      });
      if (otherFailures.length > 10) {
        console.log(`  ... and ${otherFailures.length - 10} more`);
      }
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚡ WARNINGS:');
      this.warnings.slice(0, 5).forEach(w => {
        console.log(`  - ${w.test}: ${w.message}`);
      });
      if (this.warnings.length > 5) {
        console.log(`  ... and ${this.warnings.length - 5} more`);
      }
    }
    
    // Recommendation
    console.log('\n=== RECOMMENDATION ===');
    if (passRate < 75 || criticalFailures.length > 0) {
      console.log('❌ This build has serious semantic issues and is NOT ready for gameplay.');
      console.log('   Focus on fixing placeholder data and improving prompts.');
    } else if (passRate < 85) {
      console.log('⚠️  This build has quality issues that will impact gameplay.');
      console.log('   Consider fixing major issues before production use.');
    } else {
      console.log('✅ This build meets semantic quality standards!');
      console.log('   Minor issues can be addressed in future iterations.');
    }
    
    console.log('\nFor detailed semantic test criteria, see GDD/06_SEMANTIC_TESTS.md');
  }
}

// Main execution
async function runValidator() {
  const unifiedPath = path.join(DATA_DIR, 'processed/unified_master.json');
  const unified = await readJSON(unifiedPath);
  
  if (!unified) {
    console.error('No unified_master.json found. Run build first.');
    return;
  }
  
  const validator = new SemanticValidator(unified);
  await validator.validate();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidator().catch(console.error);
}

export { SemanticValidator };