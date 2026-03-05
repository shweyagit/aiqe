import { JiraClient } from './jira.js';

class JiraReporter {
  constructor() {
    this.results = [];
    this.pendingReports = [];
    this.client = null;
    this.transitionOnPass = process.env.JIRA_TRANSITION_ON_PASS || '';
  }

  onBegin() {
    try {
      this.client = new JiraClient();
    } catch (e) {
      console.warn(`[Jira Reporter] ${e.message}`);
      this.client = null;
    }
  }

  onTestEnd(test, result) {
    if (!this.client) {
      return;
    }

    const match = test.title.match(/([A-Z]+-\d+)/);
    if (!match) {
      return;
    }

    const issueKey = match[1];
    const status = result.status === 'passed' ? 'PASSED' : 'FAILED';
    const duration = result.duration
      ? `${(result.duration / 1000).toFixed(1)}s`
      : 'N/A';
    const errorMsg = result.status === 'failed'
      ? `\nError: ${result.error?.message || 'Unknown error'}`
      : '';

    const comment = `[Playwright Test] ${status} | Duration: ${duration} | Test: ${test.title}${errorMsg}`;

    const promise = this.client
      .addComment(issueKey, comment)
      .then(() => {
        this.results.push({ issueKey, status, reported: true });
      })
      .catch((e) => {
        console.warn(`[Jira Reporter] Failed to report ${issueKey}: ${e.message}`);
        this.results.push({ issueKey, status, reported: false });
      });

    this.pendingReports.push(promise);
  }

  async onEnd() {
    await Promise.all(this.pendingReports);

    if (!this.client || this.results.length === 0) {
      return;
    }

    // Optionally transition passed tickets
    if (this.transitionOnPass) {
      const passedKeys = [
        ...new Set(
          this.results
            .filter((r) => r.status === 'PASSED' && r.reported)
            .map((r) => r.issueKey)
        ),
      ];

      for (const issueKey of passedKeys) {
        try {
          const transitions = await this.client.getTransitions(issueKey);
          const target = transitions.find(
            (t) => t.name.toLowerCase() === this.transitionOnPass.toLowerCase()
          );
          if (target) {
            await this.client.transitionIssue(issueKey, target.id);
            console.log(`[Jira Reporter] Transitioned ${issueKey} to "${this.transitionOnPass}"`);
          }
        } catch (e) {
          console.warn(`[Jira Reporter] Failed to transition ${issueKey}: ${e.message}`);
        }
      }
    }

    const reported = this.results.filter((r) => r.reported).length;
    const errors = this.results.filter((r) => !r.reported).length;
    console.log(
      `[Jira Reporter] Done: ${reported} reported, ${errors} errors out of ${this.results.length} total.`
    );
  }
}

export default JiraReporter;
