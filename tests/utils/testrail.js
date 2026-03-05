import axios from 'axios';

export const STATUS = {
  PASSED: 1,
  BLOCKED: 2,
  RETEST: 4,
  FAILED: 5,
};

export class TestRailClient {
  constructor() {
    this.baseURL = process.env.TESTRAIL_URL;
    this.username = process.env.TESTRAIL_USERNAME;
    this.apiKey = process.env.TESTRAIL_API_KEY;

    if (!this.baseURL || !this.username || !this.apiKey) {
      throw new Error(
        'TestRail credentials missing. Set TESTRAIL_URL, TESTRAIL_USERNAME, and TESTRAIL_API_KEY env vars.'
      );
    }

    this.client = axios.create({
      baseURL: `${this.baseURL}/index.php?/api/v2`,
      auth: { username: this.username, password: this.apiKey },
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async addResultForCase(runId, caseId, statusId, comment = '', elapsed = null) {
    const payload = { status_id: statusId, comment };
    if (elapsed) {
      payload.elapsed = elapsed;
    }
    const response = await this.client.post(
      `/add_result_for_case/${runId}/${caseId}`,
      payload
    );
    return response.data;
  }

  async getCase(caseId) {
    const response = await this.client.get(`/get_case/${caseId}`);
    return response.data;
  }

  async addCase(sectionId, title, options = {}) {
    const response = await this.client.post(`/add_case/${sectionId}`, {
      title,
      ...options,
    });
    return response.data;
  }

  async getRuns(projectId) {
    const response = await this.client.get(`/get_runs/${projectId}`);
    return response.data;
  }

  async getSections(projectId) {
    const response = await this.client.get(`/get_sections/${projectId}`);
    return response.data;
  }

  async addSection(projectId, name, parentId = null) {
    const payload = { name };
    if (parentId) {
      payload.parent_id = parentId;
    }
    const response = await this.client.post(`/add_section/${projectId}`, payload);
    return response.data;
  }

  async createRun(projectId, name, caseIds = []) {
    const payload = {
      name,
      include_all: caseIds.length === 0,
    };
    if (caseIds.length > 0) {
      payload.case_ids = caseIds;
    }
    const response = await this.client.post(
      `/add_run/${projectId}`,
      payload
    );
    return response.data;
  }
}
