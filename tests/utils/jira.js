import axios from 'axios';

export class JiraClient {
  constructor() {
    this.baseURL = process.env.JIRA_BASE_URL;
    this.email = process.env.JIRA_EMAIL;
    this.apiToken = process.env.JIRA_API_TOKEN;

    if (!this.baseURL || !this.email || !this.apiToken) {
      throw new Error(
        'Jira credentials missing. Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN env vars.'
      );
    }

    this.client = axios.create({
      baseURL: `${this.baseURL.replace(/\/$/, '')}/rest/api/3`,
      auth: { username: this.email, password: this.apiToken },
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getIssue(issueKey) {
    const response = await this.client.get(`/issue/${issueKey}`);
    return response.data;
  }

  async addComment(issueKey, comment) {
    const response = await this.client.post(`/issue/${issueKey}/comment`, {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: comment }],
          },
        ],
      },
    });
    return response.data;
  }

  async getTransitions(issueKey) {
    const response = await this.client.get(`/issue/${issueKey}/transitions`);
    return response.data.transitions;
  }

  async transitionIssue(issueKey, transitionId) {
    const response = await this.client.post(`/issue/${issueKey}/transitions`, {
      transition: { id: transitionId },
    });
    return response.data;
  }

  async getBoardIssues(boardId, jql = '') {
    const url = `${this.baseURL.replace(/\/$/, '')}/rest/agile/1.0/board/${boardId}/issue`;
    const response = await axios.get(url, {
      auth: { username: this.email, password: this.apiToken },
      headers: { 'Content-Type': 'application/json' },
      params: jql ? { jql } : {},
    });
    return response.data;
  }

  async searchIssues(jql) {
    const response = await this.client.post('/search', { jql });
    return response.data;
  }
}
