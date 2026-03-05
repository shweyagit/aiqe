# What to Read in Tickets

Field-by-field guide for extracting useful information from Jira tickets.
Includes positive examples (what good looks like) and negative examples
(what to flag and why).

---

## Every Field — What to Look For

### Summary / Title
Read it but do not trust it to define scope.
Titles are written at the start of a sprint. Scope drifts. The comments are truth.

✅ GOOD: "Flagging — Implement colour cycle behaviour in Color Flagging mode"
→ Specific, tells you exactly what this ticket covers

❌ BAD: "Flagging improvements"
→ Could be anything. Scope is undefined. Read comments carefully.

---

### Description
The intended behaviour at the time of writing. Often outdated by the time QA sees it.

What to extract:
- User story format: "As a [user] I want [action] so that [benefit]"
  The "so that" tells you WHY — critical for edge cases
- Any explicit out-of-scope statements
- Links to designs, Figma, or Confluence specs
- Any technical implementation notes from the dev
- Feature URL or page route
- Seed file references

✅ GOOD description contains:
```
As a video analyst, I want to flag list items with colour categories
so that I can quickly identify and group important clips.

Feature URL: https://staging.voltron.app/lists/123

Seed: playwright/e2e-seed/seed.spec.ts

Out of scope: Keyboard shortcuts (covered in TICKET-145)
```

❌ BAD description:
```
Add flagging to the list view. Should work like the design.
```
→ No user story. No URL. No seed. No scope boundary. Flag all of these as gaps.

---

### Acceptance Criteria
The most important field. The one most often wrong or missing.

#### What makes AC testable:

Each item must answer: "How do I know this passes or fails?"

✅ GOOD AC — testable:
```
AC-1: When a user clicks an unflagged cell in Color Flagging mode,
      the cell displays a Category 1 badge (colour: #E53935).
      The flag is saved to backend (POST /flags returns 201).

AC-2: Each subsequent click cycles the flag:
      Category 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → unflagged.

AC-3: In Flagging (Templates) mode, clicking toggles only between
      flagged and unflagged. No cycling occurs.

AC-4: Flag state persists after page refresh (confirmed via GET /flags).

AC-5: 'Clear All Flags' is safe to call when no flags exist —
      no error is thrown, no UI change occurs.
```

❌ BAD AC — not testable (STOP and raise):
```
- Users can flag items
- The flagging system works correctly
- Flags are saved
- The UI looks right
```

Why bad AC is dangerous for an AI pipeline:
The AI WILL generate tests against it. Those tests will be meaningless.
They will pass even when the feature is broken, because the assertions
will be too vague to catch real failures.
STOP. Do not plan. Get real AC.

---

### Comments — Read Every Single One

Comments are where the spec actually lives. What to look for:

**Scope changes:**
✅ "After discussion with PO, we decided Category 8 should loop back to unflagged, not stay on 8"
→ This is a requirement change. Update your understanding.

**Technical clarifications from dev:**
✅ "The colour format from the backend is #AARRGGBB (8 chars with alpha). The frontend normalises to #RRGGBB before rendering. This is intentional."
→ This is a testable behaviour that is NOT in the AC. Add it to your coverage.

**Scope reductions:**
✅ "Keyboard shortcuts are moved to TICKET-145. Not in scope here."
→ Remove keyboard shortcuts from this ticket's plan.

**Blockers resolved:**
✅ "Seed file is at playwright/e2e-seed/seed.spec.ts — run it before testing"
→ Record this. It answers your setup question.

**Red flags in comments:**
❌ "QA will know what to test" → No. Stop. Get AC.
❌ "Same as before but better" → Meaningless. What changed?
❌ "Almost done, will update desc later" → Description is stale. Trust comments only.
❌ "Merged in PR #442" → Go read that PR. It has the actual implementation details.

---

### Linked Issues
Never ignore linked tickets. They define what this ticket depends on and
what depends on it.

| Link type | What to do |
|---|---|
| **Blocks** | This ticket cannot be tested until the linked one is done |
| **Is blocked by** | A dependency is incomplete — flag as potential blocker |
| **Relates to** | Same feature area — include in epic scan |
| **Duplicates** | Check which is canonical, note the other |
| **Fixes / Caused by** | Bug context — understand what broke and how |
| **Child of** | Parent epic — already have this |
| **Sub-task of** | This is a sub-task — find the parent and all siblings |

---

### Status — What It Actually Means for QA

| Jira Status | What it means for QA |
|---|---|
| To Do | Not started. Do not assess yet. |
| In Progress | Being built. May not be deployed. Check. |
| In Review / PR Open | PR exists. May or may not be merged. Check. |
| Done | PR merged. May or may not be on test env. Check. |
| Ready for QA | Should be on test env. Verify before assuming. |
| In QA | QA is working on it. Check if that's you or someone else. |

"Done" in Jira does not mean "deployed to test environment."
Always verify deployment yourself by visiting the app.

---

### Priority — How It Affects Test Depth

| Priority | Test depth |
|---|---|
| Blocker | Full coverage. Every layer. Every edge case. No shortcuts. |
| Critical | Full E2E + API. Most edge cases. |
| Major | Happy path + key negative tests. |
| Minor | Happy path only unless it touches a critical flow. |

Do not write 40 test cases for a Minor cosmetic ticket.
Do not write 3 test cases for a Blocker.

---

## The Feature Link — Always Follow It

If the ticket contains a link to the feature on the test environment:
- Navigate there
- Do not assume the URL in the ticket is correct — URLs drift as routes change
- If the URL 404s → flag it. The feature may not be deployed.

If the ticket contains a Figma or design link:
- Open it
- Compare every state in the design to what is on the app
- Any state in the design that is missing from the app = potential gap or incomplete feature

If the ticket contains a Confluence spec link:
- Read it fully
- The Confluence spec may have more detail than the ticket AC
- Conflicts between Confluence spec and ticket AC → flag to human
