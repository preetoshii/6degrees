import { summaryLogger } from './logger.js';

export class BuildMonitor {
  constructor() {
    this.startTime = Date.now();
    this.stats = {
      phase1: {
        wordsProcessed: 0,
        apiCalls: 0,
        errors: 0,
        retries: 0,
        orphansCreated: 0
      },
      phase2: {
        traitsProcessed: 0,
        clustersCreated: 0,
        traitsPromoted: 0
      },
      phase2_5: {
        rolesProcessed: 0,
        clustersCreated: 0,
        rolesPromoted: 0
      },
      phase3: {
        orphansFound: 0,
        orphansAdopted: 0,
        adoptionFailures: 0,
        cyclesDetected: 0
      },
      phase3_5: {
        totalNodes: 0,
        duplicatesFound: 0
      },
      api: {
        totalCalls: 0,
        totalTokens: 0,
        estimatedCost: 0,
        rateLimitHits: 0,
        timeouts: 0
      },
      performance: {
        phasesDurations: {},
        totalDuration: 0
      }
    };
  }

  // Phase 1 tracking
  incrementWordsProcessed() {
    this.stats.phase1.wordsProcessed++;
  }

  incrementAPICall(tokensUsed = 100) {
    this.stats.phase1.apiCalls++;
    this.stats.api.totalCalls++;
    this.stats.api.totalTokens += tokensUsed;
    this.updateCostEstimate();
  }

  incrementError(phase = 'phase1') {
    this.stats[phase].errors++;
  }

  incrementRetry() {
    this.stats.phase1.retries++;
  }

  trackOrphanCreated(count = 1) {
    this.stats.phase1.orphansCreated += count;
  }

  // Phase 2 tracking
  updatePhase2Stats(traitsProcessed, clustersCreated, traitsPromoted) {
    this.stats.phase2 = {
      traitsProcessed,
      clustersCreated,
      traitsPromoted
    };
  }

  // Phase 2.5 tracking
  updatePhase2_5Stats(rolesProcessed, clustersCreated, rolesPromoted) {
    this.stats.phase2_5 = {
      rolesProcessed,
      clustersCreated,
      rolesPromoted
    };
  }

  // Phase 3 tracking
  updatePhase3Stats(orphansFound, orphansAdopted, adoptionFailures, cyclesDetected) {
    this.stats.phase3 = {
      orphansFound,
      orphansAdopted,
      adoptionFailures,
      cyclesDetected
    };
  }

  // API tracking
  trackRateLimitHit() {
    this.stats.api.rateLimitHits++;
  }

  trackTimeout() {
    this.stats.api.timeouts++;
  }

  // Cost estimation
  updateCostEstimate() {
    // GPT-4 Turbo pricing (approximate)
    const costPer1kTokens = 0.004;
    this.stats.api.estimatedCost = (this.stats.api.totalTokens / 1000) * costPer1kTokens;
  }

  // Phase timing
  startPhase(phaseName) {
    this.phaseStartTime = Date.now();
    this.currentPhase = phaseName;
  }

  endPhase(phaseName) {
    const duration = Date.now() - this.phaseStartTime;
    this.stats.performance.phasesDurations[phaseName] = duration;
  }

  // Get formatted report
  getReport() {
    const totalDuration = Date.now() - this.startTime;
    const durationMinutes = (totalDuration / 1000 / 60).toFixed(2);
    
    return {
      summary: {
        totalDuration: `${durationMinutes} minutes`,
        totalWords: this.stats.phase1.wordsProcessed,
        totalAPICalls: this.stats.api.totalCalls,
        estimatedCost: `$${this.stats.api.estimatedCost.toFixed(2)}`,
        totalErrors: Object.values(this.stats).reduce((sum, phase) => 
          sum + (phase.errors || 0), 0
        )
      },
      phases: {
        phase1: this.stats.phase1,
        phase2: this.stats.phase2,
        phase2_5: this.stats.phase2_5,
        phase3: this.stats.phase3,
        phase3_5: this.stats.phase3_5
      },
      api: this.stats.api,
      performance: this.stats.performance
    };
  }

  // Save report to summary
  async saveReport() {
    const report = this.getReport();
    await summaryLogger.updateSummary({ finalReport: report });
    return report;
  }

  // Console display
  displayProgress() {
    const report = this.getReport();
    console.log('\n=== Build Progress ===');
    console.log(`Duration: ${report.summary.totalDuration}`);
    console.log(`Words Processed: ${report.summary.totalWords}`);
    console.log(`API Calls: ${report.summary.totalAPICalls}`);
    console.log(`Estimated Cost: ${report.summary.estimatedCost}`);
    console.log(`Errors: ${report.summary.totalErrors}`);
    console.log('====================\n');
  }
}

// Singleton instance
export const monitor = new BuildMonitor();