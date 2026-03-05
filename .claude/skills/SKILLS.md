# AI QA Pipeline — Skills

This is a standalone AI-powered QA pipeline. The AI operates as a QA engineer:
fetching tickets, visiting the live feature, reasoning about coverage, writing
test plans, publishing to Confluence, pushing to TestRail, and generating
automation tests — with a human reviewing at defined gates before any external
system is written to.

This is a DEMO repository. It showcases the full QA pipeline concept across
every test layer: E2E, API, Integration, and Component.

---

## Repo Structure

```
.claude/
└── skills/                    ← skill files (this folder)

e2e/                           ← Playwright E2E tests
api/                           ← PactumJS API tests
integration/                   ← Integration tests
component/                     ← Black-box component tests (Playwright CT)
performance/                   ← k6 performance tests
test-plans/                    ← Local copies of published test plans
test-cases/                    ← Generated test cases before TestRail push
```

Note: This is a standalone test repo. No dev source code lives here.
Component tests are black-box — testing rendered behaviour, not internals.

---

## Pipeline Overview

```
YOU: "/receiving-tickets EPIC-42"
          │
          ▼
┌─────────────────────────────┐
│   /receiving-tickets        │  AI fetches ALL tickets in epic.
│                             │  Visits live feature on app.
│   [HITL GATE 1]             │  ← AI shows findings. You confirm
│   AI presents findings      │    before any writing happens.
│   You: approve / correct    │
│                             │
│   AI writes to:             │
│   • Jira (intake summary)   │
│   • Confluence (feature     │
│     coverage page created)  │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   /planning-tests           │  AI builds full test plan.
│                             │  Decides layers per ticket.
│   [HITL GATE 2]             │  ← Most important gate.
│   AI presents test plan     │    You review coverage decisions.
│   You: approve / adjust     │
│                             │
│   AI writes to:             │
│   • Confluence (test plan   │
│     published under feature │
│     coverage page)          │
│   • Jira (plan summary +    │
│     Confluence link added)  │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   /designing-cases          │  AI writes detailed test cases.
│                             │  E2E, API, Integration, Component.
│   [HITL GATE 3]             │  ← Review by exception only.
│   AI flags uncertain cases  │    You only review flagged ones.
│   You: approve flagged ones │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   /syncing-testrail         │  AI pushes cases to TestRail.
│                             │
│   [HITL GATE 4]             │  ← Confirm before push.
│   AI shows what will push   │    Hard to undo.
│   You: confirm              │
│                             │
│   AI writes to:             │
│   • TestRail (suite + run)  │
│   • Jira (TestRail links)   │
│   • Confluence (TR links    │
│     added to feature page)  │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   /generating-tests         │  AI generates automation code.
│                             │  Places in correct folder.
│   No gate — AI generates,   │  Human reviews via PR.
│   you review in PR.         │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   /analyzing-logs           │  AI parses results post-run.
│                             │  Flags failures with analysis.
│   AI updates:               │  Updates TestRail + Jira.
│   • TestRail (pass/fail)    │
│   • Jira (result summary)   │
│   • Confluence (run results │
│     added to feature page)  │
└─────────────────────────────┘
```

---

## Available Skills

| Skill | Invoke as | Phase | Trigger phrases |
|---|---|---|---|
| `receiving-tickets` | `/receiving-tickets` | 1 — Discover | "pick up epic", "receive ticket", "start a feature", "analyse EPIC-42" |
| `planning-tests` | `/planning-tests` | 2 — Plan | "plan tests", "create test plan", "what should we test" |
| `designing-cases` | `/designing-cases` | 3 — Design | "design cases", "write test cases", "expand scenarios" |
| `syncing-testrail` | `/syncing-testrail` | 4 — Manage | "push to TestRail", "sync TestRail", "upload cases" |
| `generating-tests` | `/generating-tests` | 5 — Generate | "generate tests", "write automation", "create test scripts" |
| `analyzing-logs` | `/analyzing-logs` | 6 — Analyse | "analyse logs", "why did tests fail", "check results" |

---

## AI Behaviour Rules (Global — Apply to Every Skill)

These rules apply across the entire pipeline. Every skill inherits them.

### The AI MUST:
- Read every Jira ticket field AND every comment before forming any opinion
- Visit the live feature and observe it directly — never assume behaviour from ticket alone
- Show its reasoning at every HITL gate — not just conclusions
- Produce a confidence score before proceeding past any gate
- Flag conflicts between ticket description and live app behaviour
- Never invent acceptance criteria — if AC is missing, STOP
- Never plan tests for things not in the ticket scope
- Update Jira and Confluence at the end of every skill — not optionally
- Write exactly what it will publish and wait for confirmation

### The AI MUST NOT:
- Proceed past a HITL gate without explicit human confirmation
- Assume a feature works correctly because it's deployed
- Write to TestRail without explicit confirmation
- Merge findings from different features into one plan
- Invent API endpoints it did not observe in the network tab
- Use placeholder test data — all data must be real or explicitly seeded
- Skip the confidence score
- Treat "In Development" as "Ready for QA"

### When Confidence is LOW the AI MUST stop:
```
CONFIDENCE: LOW
Reason: AC is missing / feature not visible on app / API not observed
Action: STOP. Present blockers. Ask human to resolve before continuing.
DO NOT produce a partial plan and flag it "incomplete".
A partial plan is worse than no plan — it creates false confidence.
```

---

## Confluence Structure

Every feature gets its own page under the QA space:

```
QA Space/
└── Feature Coverage/
    └── <Epic Name>/
        ├── Overview          ← created by /receiving-tickets
        │   ├── Tickets in epic
        │   ├── Readiness per ticket
        │   └── Risks flagged
        ├── Test Plan         ← created by /planning-tests
        │   ├── Coverage decisions per ticket
        │   └── Layer breakdown (E2E / API / Integration / Component)
        ├── Test Cases        ← updated by /syncing-testrail
        │   └── TestRail links per ticket
        └── Results           ← updated by /analyzing-logs
            └── Run history
```

Every ticket in the epic links to this Confluence page.
Every time a skill completes, it updates the relevant section.
This is the source of truth for what is covered and what is not.

---

## MCP Requirements

| Skill | MCP Servers Required |
|---|---|
| `receiving-tickets` | mcp-atlassian, playwright-mcp |
| `planning-tests` | mcp-atlassian |
| `designing-cases` | mcp-atlassian |
| `syncing-testrail` | testrail-mcp, mcp-atlassian |
| `generating-tests` | none (writes local files) |
| `analyzing-logs` | testrail-mcp, mcp-atlassian |

---

## Installation

```bash
make install-skills     # installs to ~/.claude/skills/
```

Restart Claude Code after installation.
