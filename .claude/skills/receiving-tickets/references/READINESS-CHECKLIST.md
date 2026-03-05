# Readiness Checklist Reference

The detailed rules behind the readiness assessment in Step 3.
Every item has a rule, a real-pain reason, and pass/fail examples.

---

## AC Readiness Rules

### Rule 1: AC must exist as discrete items, not prose

✅ PASS:
```
AC-1: Clicking unflagged cell applies Category 1 flag
AC-2: Subsequent clicks cycle through categories
AC-3: After Category 8, next click returns to unflagged
```

❌ FAIL:
```
"The flagging system allows users to cycle through colour categories
by clicking on flag cells in the table. This should feel intuitive."
```
WHY THIS MATTERS: Prose AC cannot be verified. The AI will generate tests
that check prose-level behaviour ("does clicking do something") rather than
specific behaviour ("does Category 3 follow Category 2"). Bugs hide in specifics.

---

### Rule 2: Error messages must be specified exactly

✅ PASS:
```
AC: When the user attempts to flag an item with no valid ID,
    the flag cell is non-interactive and the tooltip reads:
    "Cannot flag auto-generated items"
```

❌ FAIL:
```
AC: Show an appropriate error when the item cannot be flagged
```
WHY THIS MATTERS: "Appropriate error" means nothing testable. A blank screen
could be considered "appropriate" by the AI's assertion. Real bugs get missed.

---

### Rule 3: All modes must be specified in AC

If a feature has modes (e.g., Color Flagging vs Binary Flagging), every mode
must have its own AC items.

✅ PASS:
```
AC (Color mode): Clicking cycles through 8 categories
AC (Binary mode): Clicking toggles between flagged and unflagged only
AC (Toggle First mode): Clicking only applies/removes Category 1
```

❌ FAIL:
```
AC: Flagging works in all modes
```
WHY THIS MATTERS: The AI will only test the mode it happened to observe
on the app. The other modes get missed entirely.

---

### Rule 4: AC must cover the empty/zero state

✅ PASS:
```
AC: 'Clear All Flags' is safe to call when no flags are present.
    No error is thrown. The table remains unchanged. No console errors.
```

❌ FAIL:
```
AC: Clear All Flags removes all flags
```
WHY THIS MATTERS: The happy path is "flags exist, then cleared." The edge case
is "no flags exist, user clicks Clear All." That's where null pointer exceptions
hide. Teams always test the happy path and ship the edge case bug.

---

## Deployment Readiness Rules

### Rule 5: "Done" in Jira ≠ deployed to test environment

Always verify by navigating to the feature URL.

✅ PASS: Feature URL returns the feature with correct UI
❌ FAIL: Feature URL 404s, or shows old behaviour, or is inaccessible

If feature is not deployed → ticket is BLOCKED for QA, regardless of Jira status.
Do not plan. Do not write cases. The plan will be invalid when the real
build deploys and behaviour differs from what was specced.

---

### Rule 6: Seed must exist and be runnable

If the feature requires data to be in a specific state for testing to work:

✅ PASS: Seed file path is identified. File exists. It creates the required state.
⚠️ PARTIAL: Seed file exists but does not cover all required states.
❌ FAIL: No seed file mentioned. No way to create test data. Cannot test.

WHY THIS MATTERS: Without seed data, the first test step will fail on setup,
not on the feature being tested. This creates false failures and wastes
debugging time during test runs.

---

## Conflict Detection Rules

### Rule 7: Ticket description vs live app — always compare

When what the ticket says differs from what the app shows:

✅ CORRECT BEHAVIOUR — flag the conflict:
```
⚠️ CONFLICT DETECTED
Ticket says: 8 colour flag categories
App shows:   6 colour options in the dropdown
Source:      TICKET-141, description paragraph 2 vs app screenshot
Action:      Ask human — is the app wrong (incomplete build) or is the ticket wrong (stale spec)?
```

❌ WRONG BEHAVIOUR — never silently choose one:
```
// Do not write: "I'll go with what the app shows"
// Do not write: "I'll go with what the ticket says"
// Always surface the conflict to the human
```

### Rule 8: Design vs app — always compare

If a Figma or design link is attached:

✅ CORRECT: Note every state in the design that is absent from the app.
```
⚠️ GAP DETECTED
Design shows: A loading spinner when flags are being applied
App shows:    No loading state — flag cell changes immediately
→ Is loading state not yet built, or was it removed from scope?
```

❌ WRONG: Assume absence means it was intentionally removed.

---

## Scope Guardrails

### Rule 9: Never plan for tickets not in this epic

If while visiting the app you see a related feature that is NOT covered
by any ticket in this epic — note it but do not plan for it.

✅ CORRECT:
```
NOTE: Observed a 'Filter by Flag' feature in the table header.
This is not covered by any ticket in EPIC-42.
Not planning for it. If it needs coverage, a new ticket should be raised.
```

❌ WRONG:
```
// Do not add "Filter by Flag" to the test plan because you saw it
// Do not raise tickets yourself
// Do not assume it is covered by an existing ticket without verifying
```

### Rule 10: Never plan for what component tests should cover

Component tests (in this repo: `/component/` folder) cover individual
UI components in isolation. E2E tests cover user journeys.

Do not write E2E tests for things that are better covered at component level:
- Individual button state rendering
- Tooltip content in isolation
- ARIA attribute presence on a single element
- Colour value of a badge in isolation

These belong in `/component/` not in the E2E plan.

✅ CORRECT split:
```
Component test: Flag badge renders correct colour for each category
E2E test: User can cycle through all 8 categories by clicking flag cell
```

---

## The Pain Rules — Real Failures This Checklist Prevents

These rules exist because these exact things have gone wrong in real projects:

**"Test was passing but feature was broken"**
→ Caused by: vague AC, AI generated assertion that was too broad
→ Rule 2 and Rule 1 prevent this

**"We tested the wrong thing for 2 weeks"**
→ Caused by: ticket description was stale, comments had the real spec
→ WHAT-TO-READ-IN-TICKETS Rule (Comments) prevents this

**"Plan was written but feature wasn't even deployed"**
→ Caused by: trusting "Done" status in Jira
→ Rule 5 prevents this

**"AI invented an API endpoint that doesn't exist"**
→ Caused by: AI inferring endpoints from ticket description
→ Global guardrail ("only record observed endpoints") prevents this

**"Test data didn't exist, 40 tests failed on setup step"**
→ Caused by: seed requirements not identified at intake
→ Rule 6 prevents this

**"We missed binary mode entirely"**
→ Caused by: AC didn't mention it, AI only tested what it saw first
→ Rule 3 prevents this
