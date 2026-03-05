# Intake Document Template

This is the output of /receiving-tickets. Saved locally to `test-plans/<epic-id>-intake.md`.
Also published to Confluence under the feature coverage page.
Also summarised in a comment on every Jira ticket in the epic.

Every field must be filled. Use "N/A" or "Not found — see risk" if genuinely unavailable.
Empty fields are not acceptable.

---

```
═══════════════════════════════════════════════════════
QA TICKET INTAKE — EPIC: <EPIC_ID>
<Epic Title>
Generated: <ISO date>
Pipeline: receiving-tickets v1
═══════════════════════════════════════════════════════

CONFLUENCE PAGE: <link — created by this skill>
TEST ENVIRONMENT: <base URL>

───────────────────────────────────────────────────────
TICKETS IN THIS EPIC
───────────────────────────────────────────────────────
<TICKET_ID>: <Title> — Status: <Jira status> — QA Readiness: READY / BLOCKED / NEEDS CLARIFICATION
<TICKET_ID>: <Title> — Status: <Jira status> — QA Readiness: READY / BLOCKED / NEEDS CLARIFICATION
...

CAN FULL FLOW BE TESTED NOW: Yes / No / Partial
Reason if No/Partial: <exact reason>

───────────────────────────────────────────────────────
FEATURE OBSERVATION (from app visit)
───────────────────────────────────────────────────────
Feature URL visited: <URL>
Screenshot taken: Yes / No / Feature not found

WHAT THE FEATURE DOES:
<Your own description from visiting the app — not copy-pasted from ticket.
 Describe every mode, every state, every interaction you observed.>

STATES OBSERVED:
- Default state: <describe>
- Loaded state: <describe>
- Error state: <describe or "could not trigger">
- Empty state: <describe or "not observed">
- Mode variations: <list each mode and what it does>

CONSOLE ERRORS FOUND:
- <error message and when it appeared> / None

───────────────────────────────────────────────────────
API SURFACE (from network tab observation)
───────────────────────────────────────────────────────
<METHOD> <endpoint>
  Triggered by: <user action>
  Auth: <yes/no — type>
  Request: <key fields and types>
  Response: <key fields and types>
  Status: <200/201/etc>

<METHOD> <endpoint>
  ...

NOTES: <anything unusual — auth patterns, pagination, websocket, polling>
<or: "No API calls observed — pure frontend state">

───────────────────────────────────────────────────────
ACCEPTANCE CRITERIA ASSESSMENT
───────────────────────────────────────────────────────
TICKET: <TICKET_ID>

AC-1: <verbatim from ticket>
  Testable: ✅ Yes / ⚠️ Needs clarification / ❌ Cannot test as written
  Clarification needed: <specific question if ⚠️ or ❌>

AC-2: <verbatim>
  Testable: ...

TICKET OVERALL: READY / BLOCKED / NEEDS CLARIFICATION
Blocker detail: <if blocked>

───────────────────────────────────────────────────────
CONFLICTS DETECTED
───────────────────────────────────────────────────────
CONFLICT 1:
  Ticket says: <quote>
  App shows: <observation>
  Source: <TICKET_ID, field/comment reference>
  Action needed: <question for human>

<or: None detected>

───────────────────────────────────────────────────────
DEPENDENCY MAP
───────────────────────────────────────────────────────
<TICKET_ID>: <Can test independently / Depends on TICKET_X because ...>
<TICKET_ID>: ...

RECOMMENDED PLANNING ORDER:
1. <TICKET_ID> — reason
2. <TICKET_ID> — reason
...

───────────────────────────────────────────────────────
SETUP REQUIRED BEFORE TESTING
───────────────────────────────────────────────────────
- [ ] <setup item> — owner: QA/Dev/DevOps — status: Done/Pending
- [ ] <setup item> — ...
<or: None required beyond standard seed>

SEED FILE: <path or "not found">
TEST ACCOUNTS NEEDED: <list roles / "standard accounts sufficient">

───────────────────────────────────────────────────────
CONFIDENCE SCORES
───────────────────────────────────────────────────────
<TICKET_ID>: HIGH / MEDIUM / LOW — <one line reason>
<TICKET_ID>: ...

OVERALL EPIC CONFIDENCE: HIGH / MEDIUM / LOW

───────────────────────────────────────────────────────
RISKS FLAGGED
───────────────────────────────────────────────────────
RISK 1: <description — e.g., "Template switch is destructive — clears all flags.
         No undo. Needs confirmation dialog test.">
RISK 2: <description>
<or: None identified>

───────────────────────────────────────────────────────
GAPS REQUIRING HUMAN INPUT
───────────────────────────────────────────────────────
GAP 1: <question — e.g., "AC-3 on TICKET-142 says 'appropriate error message'
        but does not specify the message text. What should it say?">
GAP 2: <question>
<or: None>

───────────────────────────────────────────────────────
POST-PLANNING TRACKING (update as pipeline progresses)
───────────────────────────────────────────────────────
- [ ] Test plan created — /planning-tests
- [ ] Test plan published to Confluence
- [ ] All Jira tickets updated with plan summary
- [ ] Test cases designed — /designing-cases
- [ ] Test cases pushed to TestRail — /syncing-testrail
      TestRail Suite ID: TR-SUITE-___
      TestRail Run ID:   TR-RUN-___
- [ ] All Jira tickets updated with TestRail links
- [ ] Automation tests generated — /generating-tests
- [ ] Tests executed
- [ ] Results published to Confluence
- [ ] All Jira tickets updated with results
═══════════════════════════════════════════════════════
```

---

## Jira Comment Template

Posted to every ticket in the epic after human confirms at HITL Gate 1.

```
🤖 QA Pipeline — Ticket Intake Complete

Status: READY / BLOCKED / NEEDS CLARIFICATION

Confluence: <link to feature coverage page>

Summary: <2-3 sentences — what the AI observed, what the confidence is,
          any specific gap or conflict for this ticket>

Next step: /planning-tests will begin after all READY tickets are assessed.
```

For BLOCKED tickets:
```
🤖 QA Pipeline — Ticket Intake BLOCKED

Reason: <exact reason — e.g., "AC is missing. Cannot plan without testable criteria.">
Action required: <what needs to happen — e.g., "PO to add AC to this ticket">
Owner: <who needs to act>

Confluence: <link>
```
