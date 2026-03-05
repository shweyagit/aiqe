import { TestRailClient, STATUS } from './testrail.js';

class TestRailReporter {
  constructor() {
    this.results = [];
    this.pendingReports = [];
    this.runId = process.env.TESTRAIL_RUN_ID;
    this.client = null;
  }

  onBegin() {
    if (!this.runId) {
      return;
    }
    try {
      this.client = new TestRailClient();
    } catch (e) {
      console.warn(`[TestRail Reporter] ${e.message}`);
      this.client = null;
    }
  }

  onTestEnd(test, result) {
    if (!this.client) {
      return;
    }

    const match = test.title.match(/C(\d+)/);
    if (!match) {
      return;
    }

    const caseId = parseInt(match[1], 10);
    const statusId = this._mapStatus(result.status);
    const elapsed = result.duration
      ? `${Math.round(result.duration / 1000)}s`
      : null;
    const comment = result.status === 'failed'
      ? `Failed: ${result.error?.message || 'Unknown error'}`
      : `Status: ${result.status}`;

    const promise = this.client
      .addResultForCase(this.runId, caseId, statusId, comment, elapsed)
      .then(() => {
        this.results.push({ caseId, statusId, status: 'reported' });
      })
      .catch((e) => {
        console.warn(`[TestRail Reporter] Failed to report C${caseId}: ${e.message}`);
        this.results.push({ caseId, statusId, status: 'error' });
      });

    this.pendingReports.push(promise);
  }

  async onEnd() {
    // Wait for all pending reports to finish
    await Promise.all(this.pendingReports);

    if (!this.client || this.results.length === 0) {
      return;
    }

    const reported = this.results.filter(r => r.status === 'reported').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    console.log(
      `[TestRail Reporter] Done: ${reported} reported, ${errors} errors out of ${this.results.length} total.`
    );
  }

  _mapStatus(playwrightStatus) {
    switch (playwrightStatus) {
      case 'passed':
        return STATUS.PASSED;
      case 'failed':
      case 'timedOut':
        return STATUS.FAILED;
      case 'skipped':
        return STATUS.RETEST;
      case 'interrupted':
        return STATUS.BLOCKED;
      default:
        return STATUS.RETEST;
    }
  }
}

export default TestRailReporter;
