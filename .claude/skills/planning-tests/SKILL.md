---
name: planning-tests
description: |
  Takes the Ticket Intake Document produced by /receiving-tickets and builds
  a full test plan covering scope, objectives, strategy, layer decisions,
  entry/exit criteria, risks, and timeline. Applies ecommerce-specific
  coverage rules per ticket. Pauses for human review at HITL Gate 2 before
  publishing to Confluence and updating Jira. Use after /receiving-tickets
  has completed and been confirmed by the human.
disable-model-invocation: true
tools:
  - mcp-atlassian:jira_get_issue
  - mcp-atlassian:jira_update_issue
  - mcp-atlassian:confluence_get_page
  - mcp-atlassian:confluence_update_page
---

# Skill: Planning Tests

## Purpose

This skill answers one question:

> "What exactly will we test, at which layer, in what order, 
>  and what does done look like?"

The output is a test plan that is:
- Specific enough to generate test cases from directly
- Honest about what is NOT being tested and why
- Structured for TestRail (milestones, suites, priorities)
- Published to Confluence so the whole team can see coverage

This skill does NOT write test cases. It decides what to test.
/designing-cases writes the cases.

---

## ⛔ Global Guardrails

**NEVER:**
- Start planning if the intake document shows BLOCKED tickets —
  confirm with human which tickets to plan and which to park
- Invent test scenarios not grounded in the AC from the intake doc
- Plan component tests for behaviour better suited to E2E (and vice versa)
- Write a plan so detailed it duplicates test cases — that's /designing-cases
- Write a plan so vague it gives no direction — see BAD PLAN examples below
- Skip the confidence score
- Publish to Confluence without human confirmation at HITL Gate 2
- Plan for tickets whose AC was marked ❌ at intake — they are still blocked
- Put exploratory charters in TestRail — they go in Confluence only
- Fold performance tickets into this plan — they have their own pipeline run
- Silently drop cross-browser coverage — make an explicit decision with a reason
- Mix automated and manual coverage numbers — always report them separately
- Override the AUTO/MANUAL/EXPLORATORY tags from intake without a reason

**ALWAYS:**
- Read the full intake document before writing a single line of the plan
- Carry the AC coverage type tags from intake (AUTO/MANUAL/EXPLORATORY)
- Reference specific AC items when making coverage decisions
- Assign every automated scenario a priority (P1/P2/P3) and layer
- Assign every manual scenario a priority and explicit pass criteria
- Write exploratory charters to Confluence — never TestRail
- Record the dashboard coverage baseline (auto count + manual count per ticket)
- Explicitly state what is out of scope, why, and who owns it
- Produce entry and exit criteria that are measurable
- Flag risks that could affect planning or execution
- Update PIPELINE-CONTEXT.md current state after skill completes

---

## Step 1 — Read the Intake Document

Locate the intake document: `test-plans/<epic-id>-intake.md`

Confirm before proceeding:
- Overall epic confidence is HIGH or MEDIUM
- At least one ticket has readiness: READY
- Human has confirmed at HITL Gate 1 which tickets to plan

If any of these are not true → stop. Ask the human.

Extract and record:
- Which tickets are in scope for this plan
- The full AC list per ticket (from intake doc — do not re-fetch from Jira)
- The API surface captured at intake
- The dependency map (planning order)
- Setup requirements
- Risks already flagged

---

## Step 2 — Define Release Scope

For each ticket in scope, define:

### In Scope
Everything covered by the AC items marked ✅ or ⚠️ at intake.
List at the feature level, not the test case level.

### Out of Scope
Everything explicitly excluded. Reference the source:
- Ticket AC marked ❌ (blocked — no testable criteria)
- Explicitly listed as out of scope in the ticket
- Belongs to a ticket not yet in QA
- Better covered by dev unit tests (if dev repo is accessible)
- Not in scope for this sprint

### ⚠️ WRONG — vague scope:
```
In scope: The flagging feature
Out of scope: Other features
```

### ✅ RIGHT — specific scope:
```
In scope (TICKET-141):
  - Flag cell click behaviour in Color Flagging mode
  - Cycle through 8 categories and return to unflagged
  - Flag state persistence after page refresh
  - API: POST /flags, GET /flags

Out of scope (TICKET-141):
  - Keyboard shortcuts → TICKET-145 (Not in QA yet)
  - Bulk actions → TICKET-144 (Not in QA yet)
  - Binary mode → TICKET-142 (In QA — separate plan section)
  - Accessibility/ARIA → TICKET-146 (Not in QA yet)
  - Performance under large item counts → no ticket, not this sprint
```

---

## Step 3 — Define Test Objectives

Write 3-5 objectives for the full epic.
Then write specific objectives per ticket.

Objectives must be measurable. They are used in exit criteria.

### ⚠️ WRONG — unmeasurable objectives:
```
- Make sure flagging works
- Test all the things
- Ensure quality
```

### ✅ RIGHT — measurable objectives:
```
Epic objectives:
  1. Validate all AC items for TICKET-141 through TICKET-143
  2. Achieve 100% E2E coverage of the primary user journey
     (open list → flag item → cycle categories → verify persistence)
  3. Validate all API endpoints identified at intake against
     correct request/response shapes and auth requirements
  4. Confirm no regression in adjacent features
     (list loading, row selection, video playback)
  5. Achieve 0 P1 test failures before sign-off

TICKET-141 specific objectives:
  - Confirm Color Flagging cycle behaviour matches AC-1 through AC-3
  - Confirm POST /flags creates correct record and returns correct shape
  - Confirm flag state persists across page refresh (AC-6)
  - Confirm Category colours render in #RRGGBB not #AARRGGBB (AC-7)
```

---

## Step 4 — Design the Test Strategy

### 4a — Assign Coverage Layers Per AC Item

For every AC item, decide which layer tests it.
Use the decision rules in `references/COVERAGE-DECISION-RULES.md`.

Format:
```
AC-1: [AC text]
  Layer: E2E
  Reason: User-facing interaction, requires browser rendering
  Priority: P1

AC-2: [AC text]
  Layer: E2E + API
  Reason: UI cycle behaviour (E2E) + backend persistence (API)
  Priority: P1

AC-3: [AC text]
  Layer: API
  Reason: Response shape validation — no UI involvement needed
  Priority: P1

AC-4: [AC text]
  Layer: Component
  Reason: Isolated badge colour rendering — doesn't need full page
  Priority: P2
```

### 4b — Define Testing Types Per Layer

```
E2E (Playwright):
  - Happy path journeys
  - Cross-mode behaviour (Color / Binary / Toggle First)
  - State persistence (refresh, navigation)
  - Negative: error states, empty states, invalid interactions

API (PactumJS):
  - Request/response shape validation per endpoint
  - Auth: with token / without token / wrong role
  - Status codes: 200/201/400/401/403/404
  - Contract testing against known schema

Integration:
  - Service-to-service flows
  - Flag created → reflected in list render
  - Template switch → flags cleared → confirmed via API

Component (Playwright CT):
  - Flag badge renders correct colour per category
  - Unflagged state renders '-' correctly
  - Loading state renders spinner
  - Tooltip content per state

Regression:
  - Adjacent features not broken:
    list loading, row selection, video playback, sorting
```

### 4c — Automated vs Manual vs Exploratory Split

This is the most important planning decision for TestRail and the dashboard.
Every scenario must land in exactly one of these three buckets.

**Read the AC coverage type tags from the intake document first.**
The intake document pre-tagged each AC item as AUTO / MANUAL / EXPLORATORY.
Use those tags as your starting point. Override with a reason if needed.

---

#### AUTOMATED — goes into TestRail (Type: Automated) + generated by /generating-tests

Criteria: deterministic, repeatable, assertable without human judgement.

```
✅ Automate:
  - All AC items tagged AUTO at intake
  - Every happy path E2E journey
  - Every API endpoint (request shape, response shape, auth, status codes)
  - All component rendering tests
  - All integration service flows
  - All negative/error states that have exact expected output
  - Regression suite for adjacent features

❌ Do NOT automate:
  - Anything requiring human visual judgement
  - Accessibility tests requiring assistive technology
  - Tests where "correct" depends on context the AI cannot assert on
  - Exploratory scenarios (these are not test cases)
```

---

#### MANUAL SCRIPTED — goes into TestRail (Type: Manual) — run by human, tracked in TestRail

Criteria: repeatable steps, but requires human judgement to pass/fail.
These are real test cases in TestRail. They show in the dashboard under
Manual Coverage. They have pass/fail status after each run.

```
✅ Manual scripted:
  - AC items tagged MANUAL at intake
  - Accessibility — keyboard navigation, screen reader announcements
  - Visual inspection — colour contrast, layout correctness
  - Usability — does the flow feel right, is feedback clear
  - Any AC where the pass/fail criterion needs a human to evaluate

❌ Do NOT put in TestRail as manual:
  - Exploratory charters (these go in Confluence, not TestRail)
  - Ad-hoc investigation (this is exploratory, not scripted)
  - One-off checks that will never be run again
```

Manual scripted test case format (for /designing-cases):
```
ID: M-TC-001
Title: Verify keyboard navigation through flag cells
Type: Manual
Priority: P2
Steps: [numbered, explicit, reproducible]
Expected: [specific — what the human should see/hear]
Pass criteria: [exact condition — no ambiguity]
```

---

#### EXPLORATORY — goes into Confluence session notes ONLY. Never TestRail.

Criteria: unscripted, investigation-based, human-driven discovery.
These are charters, not test cases.

```
Format per charter:
  Charter: [one sentence — what area to explore]
  Time box: [45 mins]
  Focus: [what kinds of issues are you looking for]
  Notes: [filled in during/after session]
  Bugs found: [Jira links]
```

```
✅ Exploratory:
  - Scenarios tagged EXPLORATORY at intake
  - Behaviour observed on app but NOT in any AC
  - Edge cases that the team has not defined expected behaviour for
  - "What happens if..." questions with no specified answer

❌ Do NOT use exploratory for:
  - Things that have a clear expected result (automate or script manually)
  - Regression testing (automate it)
  - Reproducing a known bug (use the bug ticket)
```

Exploratory charters for this epic go in Confluence under:
`<Epic Name> — QA Coverage → Exploratory`

---

#### PERFORMANCE — separate ticket, separate plan

```
Performance tickets identified at intake: <list from intake doc>
Action: NOT planned here.
        Performance tickets get their own /planning-tests invocation.
        Tool: k6. Owner: QA. Triggered: pre-release or on schedule.
```

---

#### CROSS-BROWSER — explicit decision, not a silent drop

Read the cross-browser decision from the intake document (Step 3g).
Apply it here. Do not re-decide — carry the intake decision forward.

```
CROSS-BROWSER (from intake):
  In scope: <browsers listed at intake>
  Deferred: <browsers deferred at intake>
  Reason: <reason from intake>

If cross-browser IS in scope:
  → Add browser matrix to E2E test plan
  → Automated tests run against each browser in CI
  → Manual tests specify which browser to use

If cross-browser IS deferred:
  → Record it explicitly in Out of Scope with the reason
  → Do not silently omit it
```

---

#### Dashboard coverage mapping

After the split is complete, record the expected dashboard numbers.
/analyzing-logs uses these as the baseline for coverage %.

```
DASHBOARD COVERAGE BASELINE (TICKET-141):
  Automated:   <n> E2E + <n> API + <n> Integration + <n> Component
  Manual:      <n> scripted cases in TestRail
  Exploratory: <n> charters in Confluence

DASHBOARD COVERAGE BASELINE (TICKET-142):
  ...

EPIC TOTAL:
  Automated:   <n> total
  Manual:      <n> total
  Exploratory: <n> charters
```

---

## Step 5 — Plan Test Data and Environment

### Environment
```
Test environment URL: <from intake doc>
Branch requirement: <if specific branch needed>
Feature flag: <from intake doc>
```

### Test Data
For each test scenario, what data must exist?

```
Seed file: <path from intake doc>
Seed creates: <what state>
Run before: all flagging tests

Additional data needed:
  - qa-analyst@test.com — role: analyst — for all flagging tests
  - qa-viewer@test.com  — role: viewer  — for access control tests
  - List with 10+ rows of video clips — created by seed
  - Color Flagging template active — set by seed
  - Binary Flagging template — switched to during tests
```

### Teardown
```
After each test that mutates data:
  - Remove flags via DELETE /flags/:id
  - Reset template to Color Flagging default
  - Seed handles full reset between test groups
```

---

## Step 6 — Set Timeline and Milestones

Map to TestRail milestone format.

```
Milestone: <Epic Name> — QA Cycle 1
Target date: <sprint end date>

Phase 1 — Test Design:    [start] → [end]  (designing-cases)
Phase 2 — TestRail Sync:  [start] → [end]  (syncing-testrail)
Phase 3 — Test Generation:[start] → [end]  (generating-tests)
Phase 4 — Execution:      [start] → [end]  (manual + CI)
Phase 5 — Bug Validation: [start] → [end]
Phase 6 — Sign-off:       [end date]
```

---

## Step 7 — Define Entry and Exit Criteria

### Entry Criteria (when can testing begin?)
```
- All READY tickets are deployed to test environment ✓
- Seed file runs without error ✓
- Test accounts are accessible ✓
- TestRail suite is populated (after /syncing-testrail) ✓
- No open blocker bugs on adjacent features ✓
```

### Exit Criteria (when is testing done?)
```
- 100% of P1 test cases executed
- ≥ 95% P1 pass rate
- 100% of P2 test cases executed
- 0 open Critical or Blocker bugs
- All High bugs triaged (fix or defer decision made)
- Regression suite: 0 new failures
- Test results published to Confluence ✓
- All Jira tickets updated with outcome ✓
```

### Suspension Criteria (when to pause testing?)
```
- Test environment is down or unstable
- Blocking bug prevents more than 30% of tests from running
- Seed file fails and cannot be fixed within 2 hours
- Breaking change deployed without QA notification
```

---

## Step 8 — Document Risks

Every risk must have: description, impact, likelihood, mitigation.

```
RISK 1:
  Description: Template switch is a destructive operation —
               clears all flags across all rows with no undo
  Impact: High — if confirmation dialog has a bug, analysts lose work
  Likelihood: Medium — new feature, UI-driven destructive action
  Mitigation: Prioritise confirmation dialog tests as P1.
              Test cancellation path explicitly.
              Verify API does not clear flags until user confirms.

RISK 2:
  Description: Colour normalisation (#AARRGGBB → #RRGGBB) is a
               frontend utility not mentioned in AC
  Impact: Medium — wrong colours render silently, hard to catch visually
  Likelihood: Low — dev confirmed this is handled in normalizeFlagColor
  Mitigation: Add component test for colour normalisation.
              Assert hex format explicitly in flag badge tests.

RISK 3:
  Description: Race condition on rapid flag clicks — dev noted this
               as a risk in TICKET-141 comments
  Impact: High — flag state gets out of sync with backend
  Likelihood: Medium — async mutation without optimistic lock
  Mitigation: Add rapid-click test scenario (5 clicks, verify final state).
              Add explicit wait for mutation confirmation in test.
```

---

## Step 9 — Produce the Test Plan Document

Output the complete test plan in this format.
This is what gets reviewed at HITL Gate 2 and published to Confluence.

See `references/TEST-PLAN-TEMPLATE.md` for the full output format.

The plan must include:
- Plan ID and title
- Epic and ticket references
- Scope (in and out)
- Test objectives (measurable)
- Strategy per layer with AC mapping
- Testing types (auto vs manual)
- Test data and environment
- Timeline and milestones
- Entry and exit criteria
- Suspension criteria
- Risks with mitigations
- Confidence score

---

## ⏸️ HITL GATE 2 — Human Review

STOP. Do not publish. Present the complete test plan.

This is the most important gate in the pipeline.
The plan drives everything downstream — test cases, automation, TestRail.
A wrong plan produces wrong tests that give false confidence.

Present to human:

**1. Coverage summary — split by type**
```
TICKET-141: 6 AC items →
  Automated:   8 E2E + 4 API + 2 Component = 14 cases
  Manual:      2 scripted (accessibility)
  Exploratory: 2 charters (two-tab behaviour, rapid click)

TICKET-142: 4 AC items →
  Automated:   5 E2E + 2 API = 7 cases
  Manual:      0
  Exploratory: 1 charter (mode boundary behaviour)

TICKET-143: 7 AC items →
  Automated:   10 E2E + 1 Integration = 11 cases
  Manual:      1 scripted (dropdown keyboard nav)
  Exploratory: 0

EPIC TOTAL:
  Automated:   32 cases → TestRail (Type: Automated) + /generating-tests
  Manual:      3 cases  → TestRail (Type: Manual)
  Exploratory: 3 charters → Confluence only
```

**2. Performance tickets (not in this plan)**
```
TICKET-147: Flagging under 1000 rows → separate /planning-tests run
```

**3. Cross-browser decision**
```
<carried from intake document Step 3g>
```

**4. What is NOT being tested and why**
Be explicit. Every exclusion needs a reason and an owner.

**5. Risks flagged**
Especially any new risks identified during planning
not caught at intake.

**6. Confidence score**
```
CONFIDENCE: HIGH / MEDIUM / LOW
Reason: <one line>
```

**7. Ask explicitly:**
```
"Does this coverage match your expectations?
 Automated: <n> cases / Manual: <n> cases / Exploratory: <n> charters
 Anything I should add, remove, or reprioritise?
 Confirm to publish to Confluence and update Jira tickets."
```

DO NOT proceed until confirmed.

---

## Step 10 — Publish

Only after human confirms.

### Update Confluence
Add the test plan to the Test Plan section of the feature page:
```
confluence_update_page(
  page_id: <from intake doc>,
  section: "Test Plan",
  content: <full test plan>
)
```

### Update every Jira ticket
```
jira_update_issue(
  issue_key: "<TICKET_ID>",
  comment: "🤖 QA Pipeline — Test Plan Published

  Confluence: <link>

  Coverage:
    Automated: <n> E2E + <n> API + <n> Integration + <n> Component
    Manual:    <n> scripted cases (TestRail Type: Manual)
    Exploratory: <n> charters (Confluence)

  Priority breakdown: <n> P1 / <n> P2 / <n> P3
  Exit criteria: 95% P1 pass rate, 0 Critical bugs open

  Performance: <TICKET-n if exists / N/A>
  Cross-browser: <in scope browsers / deferred — reason>

  Next: /designing-cases"
)
```

### Save locally
```
test-plans/<epic-id>-plan.md
```

---

## Progress Checklist

- [ ] Intake document read in full
- [ ] Confirmed which tickets are in scope (human confirmed at Gate 1)
- [ ] Performance tickets noted — separate pipeline run, not in this plan
- [ ] Release scope defined (in and out of scope per ticket, with reasons)
- [ ] Cross-browser decision carried forward from intake
- [ ] Test objectives written (measurable, used in exit criteria)
- [ ] Coverage layer assigned per AC item (E2E/API/Integration/Component)
- [ ] Automated vs Manual vs Exploratory split defined per AC item
- [ ] Dashboard coverage baseline recorded (auto count + manual count)
- [ ] Exploratory charters written — Confluence destination noted
- [ ] Test data and environment documented
- [ ] Timeline and milestones set (TestRail milestone format)
- [ ] Entry criteria defined
- [ ] Exit criteria defined (measurable thresholds)
- [ ] Suspension criteria defined
- [ ] Risks documented with mitigations
- [ ] Confidence scored
- [ ] HITL Gate 2 — full plan presented to human (with split breakdown)
- [ ] Human confirmed — publish
- [ ] Confluence updated (Test Plan section + Exploratory charters section)
- [ ] All Jira tickets updated with plan summary (auto + manual + exploratory counts)
- [ ] Local copy saved to test-plans/<epic-id>-plan.md
- [ ] PIPELINE-CONTEXT.md current state updated
- [ ] Ready for /designing-cases
