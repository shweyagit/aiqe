# AI QA Pipeline

An AI-powered quality engineering pipeline built with Claude Code + MCP servers.
The AI operates as a QA engineer — picking up Jira epics, visiting the live
feature, building test plans, writing test cases, pushing to TestRail,
generating automation scripts, and publishing results to a live dashboard.

You act as the QA lead. The AI does the work. You review at defined gates
before anything is written to Jira, Confluence, or TestRail.

**Live Dashboard →** https://<username>.github.io/<repo>/

---

## What This Demonstrates

| Capability | How |
|---|---|
| AI picks up Jira epic → analyses all tickets | `/receiving-tickets` skill |
| AI visits live feature via Playwright | playwright-mcp |
| AI builds structured test plan | `/planning-tests` skill |
| Human-in-the-loop review gates | HITL gates in every skill |
| AI writes E2E, API, Integration, Component, Manual test cases | `/designing-cases` skill |
| AI pushes cases to TestRail (auto + manual separated) | `/syncing-testrail` skill |
| AI generates Playwright + PactumJS automation scripts | `/generating-tests` skill |
| CI/CD runs tests on every PR | GitHub Actions |
| AI analyses failures, detects flakiness, captures artifacts | `/analyzing-logs` skill |
| Live dashboard — coverage per epic, pass/fail, flakiness | GitHub Pages |
| Auto-publishes to Confluence, updates Jira | mcp-atlassian |

---

## First Time Setup

### 1. Clone and install

```bash
git clone https://github.com/<username>/<repo>.git
cd <repo>
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```
# Jira + Confluence
ATLASSIAN_URL=https://your-org.atlassian.net
ATLASSIAN_EMAIL=your@email.com
ATLASSIAN_TOKEN=your-atlassian-api-token

# TestRail
TESTRAIL_URL=https://your-org.testrail.io
TESTRAIL_EMAIL=your@email.com
TESTRAIL_TOKEN=your-testrail-api-token

# Test environment
TEST_ENV_URL=https://staging.your-app.com

# GitHub Pages (set after first deploy)
DASHBOARD_URL=https://<username>.github.io/<repo>/
```

### 3. Configure MCP servers

In your Claude Code `~/.claude/config.json`:

```json
{
  "mcpServers": {
    "mcp-atlassian": {
      "command": "npx",
      "args": ["mcp-atlassian"],
      "env": {
        "ATLASSIAN_URL": "<your-url>",
        "ATLASSIAN_EMAIL": "<your-email>",
        "ATLASSIAN_TOKEN": "<your-token>"
      }
    },
    "testrail-mcp": {
      "command": "npx",
      "args": ["testrail-mcp"],
      "env": {
        "TESTRAIL_URL": "<your-url>",
        "TESTRAIL_EMAIL": "<your-email>",
        "TESTRAIL_TOKEN": "<your-token>"
      }
    },
    "playwright-mcp": {
      "command": "npx",
      "args": ["@playwright/mcp"]
    }
  }
}
```

### 4. Install Claude Code skills

```bash
make install-skills
```

Restart Claude Code after installation.

### 5. Verify setup

```bash
npm run verify-setup
```

This checks: MCP connections, env variables, Playwright, TestRail access.

---

## Running the Pipeline

Open Claude Code in this repo directory. Then:

### Start from a Jira epic

```
/receiving-tickets EPIC-42
```

The AI will:
- Fetch all tickets in the epic
- Visit the live feature on the test environment
- Assess readiness of every ticket
- Present findings for your review (HITL Gate 1)
- Publish to Confluence + update Jira after your confirmation

### Continue the pipeline

```
/planning-tests       ← after receiving-tickets is confirmed
/designing-cases      ← after planning-tests is confirmed
/syncing-testrail     ← after designing-cases is confirmed
/generating-tests     ← generates automation scripts
/analyzing-logs       ← after test run completes
```

### Check current pipeline state

```
/pipeline-status
```

Shows which phase the current epic is in and what has been completed.

---

## Running Tests

```bash
# All tests
npm run test

# By layer
npm run test:e2e
npm run test:api
npm run test:integration
npm run test:component
npm run test:performance

# With UI (Playwright)
npm run test:e2e:ui

# Specific feature
npm run test:e2e -- --grep "flagging"
```

---

## Dashboard

### View live dashboard
```bash
npm run dashboard
```
Opens https://<username>.github.io/<repo>/ in your browser.

### View locally (no internet needed)
```bash
npm run dashboard:local
```
Serves dashboard from `dashboard/` on localhost:3000.

### Dashboard shows per epic:
- Automated coverage % by layer (E2E / API / Integration / Component)
- Manual coverage % (TestRail Type: Manual)
- Exploratory sessions (from Confluence)
- Pass / Fail / Blocked per ticket
- Test run history over time
- Flakiness rate per test case with run sparkline
- Failed test artifacts — video, screenshot, trace

---

## Repo Structure

```
.claude/
├── PIPELINE-CONTEXT.md     ← AI reads this first (auto-loaded by Claude Code)
└── skills/                 ← AI skill files
    ├── SKILLS.md           ← skill registry and pipeline overview
    ├── receiving-tickets/  ← Phase 1: ticket intake
    ├── planning-tests/     ← Phase 2: test planning
    ├── designing-cases/    ← Phase 3: test case design
    ├── syncing-testrail/   ← Phase 4: TestRail sync
    ├── generating-tests/   ← Phase 5: automation generation
    └── analyzing-logs/     ← Phase 6: results + dashboard

e2e/                        ← Playwright E2E tests (AI generated)
api/                        ← PactumJS API tests (AI generated)
integration/                ← Integration tests (AI generated)
component/                  ← Playwright Component tests (AI generated)
performance/                ← k6 performance tests (separate tickets)

test-plans/                 ← Local copies of published test plans
test-cases/                 ← Generated cases before TestRail push
test-results/               ← Playwright artifacts (video/screenshot/trace)

dashboard/
├── index.html              ← auto-generated dashboard
└── data/
    └── history.json        ← flakiness history per test case

docs/
├── PIPELINE-CONTEXT.md     ← full system explanation
├── JIRA-TICKET-TEMPLATE.md ← how to write tickets for this pipeline
├── DEMO-SCENARIO.md        ← the feature used to demo the pipeline
└── ADR/                    ← architecture decision records

.github/
└── workflows/
    ├── test.yml            ← runs tests on every PR
    └── dashboard.yml       ← deploys dashboard to GitHub Pages
```

---

## How to Write Jira Tickets for This Pipeline

Badly written tickets block the pipeline at intake.
See **[docs/JIRA-TICKET-TEMPLATE.md](docs/JIRA-TICKET-TEMPLATE.md)** for:
- The full ticket template
- AC guardrails with wrong/right examples
- Title patterns
- Error state requirements
- Pre-QA health checklist

---

## How the AI Makes Decisions

The AI is guided by skill files in `.claude/skills/`.
Each skill file contains:
- What the AI must and must not do (guardrails)
- Step-by-step reasoning process
- Wrong and right examples (prevents hallucination)
- HITL gate — where the AI stops and presents to you
- Publish step — what gets written and where

See **[.claude/skills/SKILLS.md](.claude/skills/SKILLS.md)** for the full pipeline overview.

---

## Tech Stack

| Purpose | Tool |
|---|---|
| AI model | Claude Sonnet (claude-sonnet-4) |
| AI agent | Claude Code |
| Ticket management | Jira |
| Documentation | Confluence |
| Test management | TestRail |
| E2E testing | Playwright |
| API testing | PactumJS |
| Performance testing | k6 |
| CI/CD | GitHub Actions |
| Dashboard | HTML + GitHub Pages |
| App navigation (AI) | playwright-mcp |
| Jira/Confluence (AI) | mcp-atlassian |
| TestRail (AI) | testrail-mcp |

---

## Contributing / Extending the Pipeline

To add a new skill:
1. Create `.claude/skills/<skill-name>/SKILL.md`
2. Follow the skill template in `.claude/skills/SKILLS.md`
3. Add to the skill registry in `SKILLS.md`
4. Run `make install-skills`

To update an existing skill:
1. Edit the SKILL.md file directly
2. Run `make install-skills` to reload
3. Test by invoking the skill in Claude Code

---

## Questions

See [docs/PIPELINE-CONTEXT.md](docs/PIPELINE-CONTEXT.md) for the full
system explanation including design decisions, HITL gate rationale,
and flakiness tracking architecture.
