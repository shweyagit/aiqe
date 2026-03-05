---
name: receiving-tickets
description: |
  Picks up all Jira tickets connected to an epic. Reads every ticket fully
  including comments. Visits the live feature on the app via Playwright.
  Captures API calls from the network. Assesses readiness of every ticket.
  Pauses for human confirmation. Then publishes a Ticket Intake Document to
  Confluence and updates every Jira ticket with a summary and Confluence link.
  Use when starting a new feature, when an epic lands in QA, or when you want
  to assess readiness before committing to a test plan.
disable-model-invocation: true
tools:
  - mcp-atlassian:jira_get_issue
  - mcp-atlassian:jira_get_issue_comments
  - mcp-atlassian:jira_search
  - mcp-atlassian:jira_get_epic_issues
  - mcp-atlassian:jira_update_issue
  - mcp-atlassian:confluence_create_page
  - mcp-atlassian:confluence_update_page
  - mcp-atlassian:confluence_get_page
  - playwright-mcp:playwright_navigate
  - playwright-mcp:playwright_screenshot
  - playwright-mcp:playwright_get_console_logs
---

# Skill: Receiving Tickets

## Purpose

This skill answers one question before any testing work begins:

> "Do we have everything we need to write a robust test plan for this feature?"

The AI acts as a QA engineer who has just been handed an epic. It reads every
ticket, visits the live feature, captures what the app actually does, checks
whether tickets are testable, and produces a structured intake document.

Nothing is published until the human reviews and confirms at HITL Gate 1.

---

## ⛔ Global Guardrails — Read Before Every Step

These apply throughout this entire skill. Violating any of these is a
pipeline failure — not a recoverable situation.

**NEVER do these:**
- Do not proceed past HITL Gate 1 without explicit human confirmation
- Do not invent acceptance criteria if they are missing — STOP and flag
- Do not assume an API endpoint exists — only record what you observe in the network tab
- Do not assume the feature works correctly because it is deployed
- Do not merge findings from two different tickets into one assessment
- Do not use "Unknown" as a final answer — investigate until you know or explicitly flag that you cannot determine it
- Do not produce a partial intake document — either complete or explicitly blocked

**ALWAYS do these:**
- Read every comment on every ticket — requirements change in comments
- Visit the app yourself via Playwright — do not trust the ticket description alone
- Produce a confidence score before the HITL gate
- Flag every conflict between what the ticket says and what the app shows
- Record exactly which Jira fields and comment lines your findings came from

---

## Step 1 — Fetch the Full Epic

The human gives you an epic ID. Start here.

```
jira_get_epic_issues(epic_key: "<EPIC_ID>")
```

This returns all tickets in the epic. For each ticket:

```
jira_get_issue(issue_key: "<TICKET_ID>")
jira_get_issue_comments(issue_key: "<TICKET_ID>")
```

Read every field of every ticket. Read every comment. Do not skim.

See `references/WHAT-TO-READ-IN-TICKETS.md` for field-by-field guidance.

**After fetching — produce this internal summary (not shown to user yet):**

```
EPIC: <ID> — <name>
Total tickets: <n>
Tickets fetched: <list all IDs and titles>
Feature links found: <any URLs in ticket descriptions>
Seed files mentioned: <any file paths mentioned>
Related epics or tickets: <any cross-links>
```

---

## Step 2 — Visit the Feature on the App

Do not skip this step. The ticket description is what someone intended to build.
The app is what was actually built. These are often different.

### 2a — Navigate to the feature

Find the feature URL from:
- The ticket description (look for a "Feature URL" or "Test environment" field)
- The acceptance criteria (often mentions a route or page name)
- A Confluence design link in the ticket

```
playwright_navigate(url: "<TEST_ENV_URL>")
playwright_screenshot()
```

If no URL is found in any ticket → flag this. Ask the human for the URL.
Do not guess at routes.

### 2b — Explore the feature as a user would

Click through the feature. Explore every visible state:
- Default/empty state
- Loaded/populated state
- Error state (try to trigger it)
- Loading state (if observable)
- Any mode switches (e.g., binary vs colour flagging)
- Any confirmation dialogs
- Any bulk actions

Take a screenshot of each distinct state.

```
playwright_screenshot()
```

### 2c — Capture API calls from the network

Open DevTools network tab equivalent. Interact with every part of the feature.
Record every network call that fires.

For each call record:
```
Method + Endpoint: POST /api/v1/flags
Triggered by: clicking a flag cell
Request shape: { itemId: string, categoryId: number }
Response shape: { id: string, itemId: string, category: number, color: string }
Status code: 201
Auth required: yes (Bearer token observed in headers)
```

If no network calls fire → this is pure frontend state.
Record: "No API calls observed — frontend state only."
Do not invent an API that does not exist.

### 2d — Check the browser console

```
playwright_get_console_logs()
```

Are there errors or warnings in the console when using the feature?
These are often pre-existing bugs or unhandled edge cases.
Record any errors found.

---

## Step 3 — Assess Every Ticket for Readiness

For each ticket in the epic, go through every item below.
Mark each: ✅ Present and clear | ⚠️ Partial or ambiguous | ❌ Missing

See `references/READINESS-CHECKLIST.md` for detailed assessment rules.

### 3a — Ticket Type Check (do this first)

Before assessing readiness, identify what kind of ticket this is.
Different types are handled differently by the pipeline.

| Ticket type | How to identify | Pipeline action |
|---|---|---|
| Feature / Story | Standard AC-driven story | Full readiness assessment — proceed |
| Bug fix | Title starts with [Bug] or type = Bug | Assess AC for regression scope |
| Performance | Label: performance / type: Performance | Note as separate ticket — do NOT fold into this plan. Record ticket ID and link. |
| Accessibility | Label: accessibility / a11y | Assess AC — plan as manual scripted tests |
| Security | Label: security | Flag to human — may need specialist review |
| Tech debt / Refactor | No user-facing AC | Note as out of scope for QA plan unless regression risk is high |

**For performance tickets specifically:**
```
PERFORMANCE TICKET DETECTED: TICKET-<n>
This ticket will be planned separately under /planning-tests (performance).
It is NOT included in this intake document.
Recorded: TICKET-<n> — <title> — Status: <Jira status>
Tool: k6
Owner: QA
```

Do not assess performance tickets for readiness in this skill.
Do not include their AC in the intake document.
Simply record their existence and move on.

### 3b — Acceptance Criteria Quality

| Check | Status | Note |
|---|---|---|
| AC exists (not just a description) | | |
| Each AC item is individually testable | | |
| AC covers the happy path | | |
| AC covers at least one error/failure state | | |
| AC covers edge cases | | |
| AC matches what is on the app (no drift) | | |
| Error messages are specified exactly | | |
| All modes/states are covered in AC | | |

**The single most important check:**
Can you write a pass/fail assertion for each AC item right now?

✅ GOOD AC (testable):
```
"When a user clicks an unflagged flag cell in Color Flagging mode,
the cell displays the Category 1 badge and the flag is saved to backend.
Subsequent clicks cycle through Category 2 through 8, then return to unflagged."
```

❌ BAD AC (not testable — STOP):
```
"Users can flag items."
"Flagging should work correctly."
"The system handles flags."
```

If AC looks like the bad examples → DO NOT proceed to planning.
Raise a blocker. The human must get real AC from the PO before planning begins.
A test plan written against bad AC is worse than no test plan.

### 3c — AC Coverage Type Tagging

For each AC item that passes the testability check, tag it with its
likely coverage type. This feeds directly into /planning-tests.

For every AC item mark:
- **AUTO** — can be scripted and run in CI without human involvement
- **MANUAL** — requires human judgement, scripted but run by a person
- **EXPLORATORY** — not in AC, needs investigation, charter-based

```
AC-1: Clicking unflagged cell applies Category 1 badge
  → AUTO — deterministic, assertable, repeatable

AC-2: Each click cycles through categories in order
  → AUTO — deterministic sequence, easy to assert

AC-3: Confirmation dialog appears before template switch
  → AUTO — UI element, assertable

AC-4: Colour contrast of badges meets WCAG AA (4.5:1 ratio)
  → MANUAL — requires human visual + tooling judgement

AC-5: Screen reader announces flag state correctly
  → MANUAL — requires assistive technology and human verification

[Observed but not in AC]: Behaviour with two browser tabs open
  → EXPLORATORY — not in AC, needs investigation charter
```

This tagging is a first pass only. /planning-tests makes the final decision.
If unsure between AUTO and MANUAL → tag as MANUAL and flag it at the HITL gate.

### 3d — Specification Completeness

| Check | Status | Note |
|---|---|---|
| Design/Figma link attached | | |
| All visual states designed (default, hover, active, error, empty, loading) | | |
| All modes designed if feature has modes | | |
| Error messages specified exactly (not "show error") | | |
| Confirmation dialogs specified | | |
| Keyboard behaviour specified (if interactive) | | |

### 3e — Technical Completeness

| Check | Status | Note |
|---|---|---|
| API endpoints identified (ticket or network tab) | | |
| Request/response shape known | | |
| Auth requirements clear | | |
| Breaking changes to existing API flagged | | |
| Third-party dependencies identified | | |
| Feature flags or toggles documented | | |

### 3f — Environment & Data

| Check | Status | Note |
|---|---|---|
| Feature is deployed to test environment | | |
| Seed file exists and path is known | | |
| Required test accounts/roles available | | |
| Third-party sandbox configured (if applicable) | | |
| Any data setup required before testing | | |

### 3g — Cross-Browser & Device Scope

Do not silently drop or silently include cross-browser coverage.
Make an explicit decision and record it.

Ask: Does the team have a browser compatibility policy?
- If YES → apply it. Record which browsers are in scope.
- If NO → check the ticket or epic for browser requirements.
- If nothing specified → record the decision explicitly:

```
CROSS-BROWSER DECISION:
  Policy: <team policy if exists / "No policy defined">
  In scope this cycle: Chrome (primary)
  Deferred: Firefox, Safari, Edge
  Reason: <demo repo / sprint constraint / low risk>
  Revisit: <when — e.g., before production readiness>
```

Never write "out of scope" without a reason.
Never include cross-browser without specifying which browsers.

---

## Step 4 — Identify Cross-Ticket Feature Connections

An epic tells a story. Individual tickets tell fragments. Your job is to
reconstruct the full user journey from the fragments.

Ask yourself:
- What is the complete user journey this epic enables?
- In what order do tickets build on each other?
- Can ticket 3 be tested independently or does ticket 1 need to be done first?
- Are there tickets in this epic that cover the same feature from different angles?
  (e.g., one ticket for the flag cell, one for the dropdown, one for keyboard shortcuts)

Produce a dependency map:

```
DEPENDENCY MAP:
TICKET-141 (Flag cell — Color mode) → can test independently
TICKET-142 (Flag cell — Binary mode) → depends on TICKET-141 (mode switch lives in dropdown)
TICKET-143 (Dropdown menu structure) → can test independently
TICKET-144 (Bulk actions) → depends on TICKET-141 (needs flags to exist first)
TICKET-145 (Keyboard shortcuts) → depends on TICKET-143 (shortcuts shown in dropdown)
TICKET-146 (Persistence after refresh) → depends on TICKET-141 (needs flags to exist)
```

This map tells you: what order to plan in, what data setup is shared, and
whether the full flow can be tested now or has blockers.

---

## Step 5 — Identify Setup Requirements

Before the first test can run, what must be true?

Common setup needs — check all of these:

- [ ] Seed script must run first — path: `<path>`
- [ ] Specific test user accounts needed — roles: `<list>`
- [ ] Feature flag must be enabled — flag name: `<name>` — who enables it: `<dev/devops>`
- [ ] Test environment must be on a specific branch — branch: `<name>`
- [ ] Third-party sandbox configured — service: `<name>`
- [ ] Another feature must be working first — feature: `<name>`
- [ ] Database must be in a specific state — how to achieve: `<method>`
- [ ] API mock server needed for external dependencies

For each setup item record:
- What it is
- Whether it is already done or still needed
- Who is responsible (QA / Dev / DevOps)
- How to verify it is ready

---

## Step 6 — Score Confidence

Before the HITL gate, score your overall confidence for each ticket.

```
CONFIDENCE SCORING:

HIGH — proceed to HITL gate
  • AC is complete, specific, and testable
  • Feature observed on app, behaviour matches AC
  • API calls captured from network tab
  • Seed data identified
  • No blockers

MEDIUM — proceed to HITL gate but flag gaps
  • AC is mostly complete but has ambiguous items
  • Feature partially visible or some states not reachable
  • Some API calls captured, others inferred
  • Minor setup questions outstanding
  • Gaps must be listed explicitly

LOW — STOP. Do not proceed to HITL gate.
  • AC is missing or completely untestable
  • Feature not deployed or not visible on app
  • No API information available
  • Blocker ticket not resolved
  • Present blockers to human. Wait for resolution.
```

**A LOW confidence score is not a failure of the pipeline.**
It is the pipeline working correctly — catching problems before they
cost hours of wasted planning work.

---

## ⏸️ HITL GATE 1 — Human Review

STOP HERE. Do not write to Jira or Confluence yet.

Present the following to the human in this exact order:

**1. Screenshots of the feature**
Show every distinct state you captured.

**2. What I observed vs what the ticket says**
```
TICKET SAYS: <description from ticket>
APP SHOWS:   <what you actually saw>
MATCH:        ✅ Matches | ⚠️ Partial | ❌ Conflict
```

**3. API calls captured**
List every endpoint observed. Be specific.

**4. Readiness summary per ticket**

```
TICKET-141: ✅ READY — confidence HIGH
TICKET-142: ⚠️ NEEDS CLARIFICATION — AC item 3 is ambiguous (see below)
TICKET-143: ❌ BLOCKED — AC missing entirely
```

**5. Conflicts detected**
```
⚠️ CONFLICT: TICKET-141 says "8 colour categories"
              App shows 6 colour options in the dropdown
              → Which is correct?
```

**6. Gaps that need human input**
```
GAP: No seed file path found in any ticket.
     I cannot determine how to create test flags.
     → Where is the seed file?
```

**7. Coverage type tagging summary**
```
TICKET-141 AC items tagged:
  AUTO:        AC-1, AC-2, AC-3, AC-6 (4 items)
  MANUAL:      AC-4, AC-5 (2 items — accessibility)
  EXPLORATORY: Two-tab behaviour, rapid click race condition

Performance tickets identified (separate pipeline):
  TICKET-147 — Flagging under 1000 rows — NOT in this plan
```

**8. Cross-browser decision**
```
CROSS-BROWSER: <decision recorded at Step 3g>
```

**9. Confidence scores per ticket**

**10. Ask explicitly:**
```
"Do you want me to:
  A) Proceed with READY tickets and park BLOCKED ones
  B) Resolve blockers first before I proceed with anything
  C) Correct any of my findings above before I publish"
```

DO NOT proceed until the human gives explicit confirmation.
"Looks good" = proceed.
"Fix X first" = fix X, re-present, wait again.

---

## Step 7 — Publish to Confluence

Only after human confirms at HITL Gate 1.

### 7a — Create or update the feature page

Check if a page already exists for this epic:

```
confluence_get_page(title: "<Epic Name> — QA Coverage", space: "QA")
```

If exists → update it.
If not → create it:

```
confluence_create_page(
  space: "QA",
  parent: "Feature Coverage",
  title: "<Epic Name> — QA Coverage",
  content: <intake document>
)
```

Page structure:
```
<Epic Name> — QA Coverage
├── Overview (this skill creates this section)
│   ├── Epic summary
│   ├── Tickets and readiness status
│   ├── Feature observed (with screenshots)
│   ├── API surface captured
│   ├── Dependency map
│   ├── Setup requirements
│   └── Risks flagged
├── Test Plan        ← /planning-tests will populate this
├── Test Cases       ← /syncing-testrail will populate this
└── Results          ← /analyzing-logs will populate this
```

### 7b — Update every Jira ticket in the epic

For each ticket (including BLOCKED ones):

```
jira_update_issue(
  issue_key: "<TICKET_ID>",
  comment: "QA Intake complete. Confluence: <link>. Status: READY/BLOCKED. <one line summary>"
)
```

For BLOCKED tickets, add a specific comment:
```
"QA Intake BLOCKED: <exact reason>. Action required: <what needs to happen>. Owner: <who>"
```

---

## Step 8 — Produce the Local Intake Document

Save a local copy to `test-plans/<epic-id>-intake.md` in the repo.

This file is the input to /planning-tests.
Do not delete it after planning — it is the audit trail.

Format: see `references/INTAKE-DOCUMENT-TEMPLATE.md`

---

## Progress Checklist

- [ ] Epic fetched — all tickets retrieved
- [ ] Every ticket read in full including all comments
- [ ] Ticket types identified (feature / bug / performance / accessibility)
- [ ] Performance tickets noted separately — NOT included in this plan
- [ ] Feature visited on app via Playwright
- [ ] All feature states observed and screenshotted
- [ ] API calls captured from network tab
- [ ] Browser console checked for errors
- [ ] Readiness assessed for every ticket (3a–3f)
- [ ] AC items tagged: AUTO / MANUAL / EXPLORATORY
- [ ] Cross-browser decision recorded explicitly
- [ ] Dependency map produced
- [ ] Setup requirements identified
- [ ] Confidence scored per ticket
- [ ] HITL Gate 1 — findings presented to human
- [ ] Human confirmed — proceed / correct / park
- [ ] Confluence page created or updated
- [ ] Every Jira ticket updated with comment and Confluence link
- [ ] Local intake document saved to test-plans/
- [ ] PIPELINE-CONTEXT.md current state updated
- [ ] Ready for /planning-tests
