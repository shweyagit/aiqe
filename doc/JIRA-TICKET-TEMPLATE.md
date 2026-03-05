# Jira Ticket Design Guide

## Why This Matters

This pipeline's AI reads your Jira tickets and makes planning decisions based
on what it finds. A badly written ticket does not just slow down the AI —
it causes the AI to plan the wrong tests, miss critical scenarios, or
hallucinate requirements that were never agreed.

The ticket is the contract between the team and the QA pipeline.
If the contract is vague, everything built on top of it is unreliable.

This guide shows exactly how to write tickets that produce robust test plans.
Every rule has a wrong example, a right example, and the reason it matters.

---

## The Golden Rules

```
1. AC must be testable line items — not prose
2. Every error state must specify the exact error message
3. Every mode must have its own AC items
4. The feature URL must be in the ticket
5. The seed file path must be in the ticket (if data setup is needed)
6. Out of scope must be explicitly stated
7. API endpoints must be named if known
8. Linked tickets must reflect real dependencies
```

Break any of these → the AI will flag the ticket as BLOCKED at intake.

---

## Full Ticket Template

Copy this for every new ticket. Every field is required.
Delete nothing. Write "N/A" if genuinely not applicable.

```
TICKET TYPE: Story / Bug / Task / Sub-task
EPIC LINK:   EPIC-<n>
LABEL(S):    <feature-name> <sprint-label>
PRIORITY:    Blocker / Critical / Major / Minor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TITLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Feature Area] — [Specific behaviour being built]

Example: Cart — Add item to basket as guest user
Example: Auth — Redirect unauthenticated user to login on protected route
Example: Flagging — Cycle through colour categories by clicking flag cell

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER STORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As a [specific user type]
I want to [specific action]
So that [specific benefit / reason]

The "so that" is not optional. It defines WHY this matters.
It drives edge case identification. Do not omit it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACCEPTANCE CRITERIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each item must be independently testable.
Write Given/When/Then or plain numbered statements.
Cover: happy path + error states + edge cases + empty states.

AC-1: [happy path]
AC-2: [next behaviour]
AC-3: [error state — with exact error message]
AC-4: [edge case]
AC-5: [empty/zero state if applicable]
AC-6: [persistence / after refresh if applicable]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUT OF SCOPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Explicitly state what this ticket does NOT cover.
Reference the ticket that covers it if one exists.

- [behaviour] — covered in TICKET-<n>
- [behaviour] — not in this sprint, no ticket yet
- N/A — this ticket covers the complete feature

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Figma: [link to specific frame — not just the project root]
States designed: default / hover / active / error / empty / loading
Notes: [any states that are intentionally NOT designed]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECHNICAL NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Feature URL (test env): https://staging.app.com/[route]
API endpoints affected:
  - POST /api/v1/[endpoint] — [what it does]
  - GET  /api/v1/[endpoint] — [what it returns]
  - N/A — frontend only, no API calls

Breaking changes: Yes / No
If yes: [what breaks and what is affected]

Feature flag: [flag name and current state] / N/A

Seed file: playwright/e2e-seed/[filename].spec.ts / N/A
Seed creates: [what state the seed sets up]

Third-party dependencies: [service name and sandbox URL] / None

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LINKED TICKETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Blocks: TICKET-<n> [reason]
Is blocked by: TICKET-<n> [reason]
Relates to: TICKET-<n> [reason]
N/A

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEFINITION OF DONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- [ ] Code complete and PR merged
- [ ] Deployed to test environment
- [ ] Unit/component tests written by dev
- [ ] QA sign-off
- [ ] No critical/high bugs open
- [ ] Confluence updated (if architecture changed)
```

---

## AC Guardrails — Right vs Wrong

### ❌ WRONG: Prose AC — blocks the entire pipeline

```
The cart should allow users to add items and manage their basket.
Items should be saved and totals should calculate correctly.
Errors should be handled gracefully.
```

**Why this breaks the pipeline:**
- "Should allow" — allow how? Under what conditions?
- "Correctly" — correct according to what spec?
- "Gracefully" — the AI cannot assert on "graceful"
- The AI will generate tests that pass even when the feature is broken
- Every generated test case will have vague assertions like
  `expect(cart).toBeTruthy()` — meaningless

---

### ✅ RIGHT: Testable AC — pipeline runs cleanly

```
AC-1: When a logged-in user clicks "Add to Cart" on a product with stock,
      the cart icon badge increments by 1 and the item appears in the
      cart drawer with correct name, size, quantity (1), and price.
      API: POST /cart returns 201 with cartId, items[], and total.

AC-2: When the same item is added twice, the quantity updates to 2.
      A second line item is NOT created. Total = price × 2.

AC-3: When the user attempts to add an out-of-stock item,
      the "Add to Cart" button is disabled and displays "Out of Stock".
      No API call is made. Cart is unchanged.

AC-4: When the user updates quantity to 0 via the cart drawer,
      the item is removed from the cart.
      API: DELETE /cart/:itemId returns 200.
      Cart icon badge decrements by 1.

AC-5: When the cart is empty, the cart drawer displays:
      "Your basket is empty" with a "Continue Shopping" link.
      The cart icon badge is hidden (not showing 0).

AC-6: Cart contents persist after page refresh.
      GET /cart on page load returns the same items as before refresh.
```

**Why this works:**
- Every AC has a specific trigger (when X happens)
- Every AC has a specific assertion (Y must be true)
- Error messages are exact strings
- API calls are named
- Empty state is explicitly covered
- Persistence is explicitly covered

---

## Title Guardrails — Right vs Wrong

### ❌ WRONG titles

```
"Flagging improvements"         — what improvements? covers 1 thing or 10?
"Fix the cart bug"              — which bug? what's the expected behaviour?
"Update user profile"           — add? change? remove? which fields?
"Search functionality"          — build from scratch? fix? improve?
"QA ticket"                     — this is not a title
```

### ✅ RIGHT titles

```
"Cart — Add item as guest user (no account required)"
"Cart — Remove item from basket and recalculate total"
"Auth — Redirect unauthenticated user to /login with return URL"
"Flagging — Cycle through colour categories in Color Flagging mode"
"Search — Filter results by category with multiple active filters"
```

Pattern: `[Feature Area] — [Specific behaviour] [(context if needed)]`

---

## User Story Guardrails — Right vs Wrong

### ❌ WRONG: Missing the "so that"

```
As a user I want to add items to my cart.
```

**Why this is bad:**
- Missing WHY means the AI doesn't know the business intent
- Business intent drives edge cases
- Without it: AI plans happy path only
- With it: AI plans for guest vs logged-in, for save-for-later, for 
  returning to cart after session expires etc.

### ❌ WRONG: Too vague a user

```
As a user I want the system to work correctly.
```

"A user" and "work correctly" are not testable. Blocked.

### ✅ RIGHT: Complete user story

```
As a guest user (not logged in)
I want to add items to my basket and proceed to checkout
So that I can make a purchase without creating an account,
reducing friction and abandonment at the point of purchase.
```

**Why this works:**
- "Guest user" — specific role, drives auth-related test scenarios
- "Add items AND proceed to checkout" — defines the full journey
- "So that" — gives context: reducing abandonment means we need to
  test the full flow without interrupting for login, test that
  basket persists through guest checkout, test that guest can
  convert to account at order confirmation

---

## Error State Guardrails — Right vs Wrong

### ❌ WRONG: Vague error states

```
AC: Show an error if the payment fails.
AC: Display appropriate feedback when the form is invalid.
AC: Handle network errors gracefully.
```

**Why this breaks:**
The AI cannot assert on "appropriate feedback" or "gracefully".
It will write `expect(errorElement).toBeVisible()` —
which passes even if the wrong error is shown,
or if the error is shown for the wrong reason.
Real bugs ship.

### ✅ RIGHT: Exact error states

```
AC: When payment is declined, display the error message:
    "Your payment was declined. Please check your card details
    or try a different payment method."
    The user remains on the payment step. The order is NOT created.
    API: POST /payments returns 402 with code: "card_declined".

AC: When the email field is submitted empty, display inline:
    "Email address is required"
    below the email input field, in red (#D32F2F).
    Focus returns to the email field.

AC: When the network request fails (timeout or 500),
    display a toast notification:
    "Something went wrong. Please try again."
    The form retains all previously entered data.
    A retry button is shown.
```

---

## Out of Scope Guardrails — Right vs Wrong

### ❌ WRONG: No out of scope section

```
[Section missing entirely]
```

**Why this breaks:**
The AI visits the app and sees the full feature — including parts
not in this ticket. Without explicit out of scope, it will plan
tests for adjacent features it observed. Those tests will be
assigned to the wrong ticket. Coverage tracking breaks.

### ❌ WRONG: Vague out of scope

```
Out of scope: other features
```

Meaningless. "Other features" could mean anything.

### ✅ RIGHT: Explicit out of scope

```
Out of scope:
- Keyboard shortcuts for flagging — covered in TICKET-145
- Bulk flag operations (Select All Flagged, Clear All) — covered in TICKET-144
- Flag persistence after template switch — covered in TICKET-143
- Accessibility/ARIA compliance — covered in TICKET-146
- Performance under large item counts — not in scope for this sprint
```

---

## Technical Notes Guardrails — Right vs Wrong

### ❌ WRONG: No technical notes

```
[Section missing]
```

**Why this breaks:**
The AI must visit the app and manually capture API calls from the
network tab. This is slower and error-prone. It may miss calls
that only fire under specific conditions (e.g., error states
that are hard to trigger manually).

### ❌ WRONG: Vague technical notes

```
Uses the cart API.
Has a backend.
Check with the dev.
```

"Check with the dev" is not information the AI can act on.

### ✅ RIGHT: Complete technical notes

```
Feature URL (test env): https://staging.shop.com/products/PROD-123

API endpoints affected:
  - POST /api/v1/cart          — adds item to cart
    Request:  { productId, quantity, variantId }
    Response: { cartId, items[], subtotal, itemCount }
  - PUT  /api/v1/cart/:itemId  — updates quantity
    Request:  { quantity }
    Response: { cartId, items[], subtotal, itemCount }
  - DELETE /api/v1/cart/:itemId — removes item
    Response: 200 { cartId, items[], subtotal, itemCount }

Auth: All endpoints require Bearer token (guest token issued on session start)

Breaking changes: No

Seed file: playwright/e2e-seed/cart-seed.spec.ts
Seed creates:
  - Guest session with empty cart
  - Product PROD-123 "Blue Hoodie" in stock, size M, price £49.99
  - Product PROD-456 "Red Tee" out of stock

Feature flag: N/A
Third-party: N/A
```

---

## Modes Guardrails — Right vs Wrong

If a feature has multiple modes, each mode MUST have its own AC.

### ❌ WRONG: Single AC covering multiple modes

```
AC: The flagging system works in both Color Flagging and Binary modes.
```

**Why this breaks:**
The AI will only test the mode it happens to encounter first on the app.
The other mode gets zero coverage. This is how entire feature modes
ship untested.

### ✅ RIGHT: AC per mode

```
Color Flagging mode:
AC-1: Clicking an unflagged cell applies Category 1 flag.
AC-2: Subsequent clicks cycle Cat1 → Cat2 → ... → Cat8 → unflagged.
AC-3: Each category displays its correct colour badge.

Binary (Flagging Templates) mode:
AC-4: Clicking an unflagged cell applies a single flag icon (not a badge).
AC-5: Clicking a flagged cell removes the flag. No cycling occurs.
AC-6: Mode switch clears all existing flags after confirmation.

Toggle First Flag mode:
AC-7: Clicking only applies/removes Category 1. Cat2-8 are not accessible.
AC-8: Behaviour is identical to binary but uses the Category 1 colour.
```

---

## Seed / Test Data Guardrails

### ❌ WRONG: No seed information

```
[No mention of test data anywhere in the ticket]
```

**Why this breaks:**
The AI generates tests that start from a state it cannot create.
Every test fails on the setup step — not on the feature.
Two hours of debugging reveals the seed was never written.

### ✅ RIGHT: Explicit seed information

```
Seed file: playwright/e2e-seed/flagging-seed.spec.ts

Seed creates:
  - List with 10 rows of video clip items
  - Color Flagging template active by default
  - All items in unflagged state
  - User logged in as qa-analyst@test.com (role: analyst)

To run seed manually:
  npx playwright test playwright/e2e-seed/flagging-seed.spec.ts

Teardown: seed cleans up after itself (deletes created list on completion)
```

---

## Epic-Level Design

Every epic should have ONE overview ticket that links all the others
and describes the complete user journey.

### ❌ WRONG: Epic with disconnected tickets

```
EPIC: Flagging Feature
  └── TICKET-141: Add flags
  └── TICKET-142: Flag dropdown
  └── TICKET-143: Keyboard shortcuts
```

No relationships. No journey. No dependency order.
The AI sees 3 isolated tickets with no context about how they connect.

### ✅ RIGHT: Epic with connected tickets

```
EPIC: Flagging Feature
Description: Complete flagging system allowing analysts to categorise
             list items using colour flags, binary flags, and keyboard
             shortcuts. Users interact via flag cells and a toolbar dropdown.

Full user journey:
  1. User opens a list → sees flag column with '-' for all rows
  2. User clicks a flag cell → Color Flagging applies Category 1
  3. User clicks again → cycles through categories
  4. User opens Flags dropdown → changes mode, runs bulk actions
  5. User uses keyboard shortcut '3' → applies Category 3 to focused row
  6. User refreshes page → flags persist

  └── TICKET-141: Flag cell — Color Flagging mode (cycle behaviour)
      [start here — no dependencies]

  └── TICKET-142: Flag cell — Binary and Toggle First modes
      [depends on TICKET-141 — mode switch lives in dropdown]
      [blocked by: TICKET-143]

  └── TICKET-143: Flags toolbar dropdown (structure + mode switching)
      [no dependencies — can test independently]

  └── TICKET-144: Bulk actions (Select All Flagged, Clear All, Unflag Selected)
      [depends on TICKET-141 — needs flags to exist]

  └── TICKET-145: Keyboard shortcuts
      [depends on TICKET-143 — shortcuts shown in dropdown]

  └── TICKET-146: Accessibility — ARIA, keyboard navigation, colour contrast
      [depends on all above — tests the complete implemented feature]
```

---

## Comment Discipline

Comments on a ticket are part of its specification.
If a requirement changes and you write it in a comment,
the ticket description MUST be updated too.

### ❌ WRONG: Change buried in comment

```
[Description still says 8 colour categories]

Comment from dev (3 days ago):
"Actually we changed this to 6 categories, the design was updated"
```

The AI reads both. It detects the conflict. It stops and flags it.
It cannot resolve the conflict itself. Planning is blocked.

### ✅ RIGHT: Description updated + comment added

```
[Description updated to say 6 colour categories]

Comment from dev (3 days ago):
"Changed from 8 to 6 categories — design updated in Figma.
 Description updated to reflect this."
```

No conflict. AI proceeds. No block.

---

## Quick Reference — Ticket Health Checklist

Before moving a ticket to "Ready for QA":

- [ ] Title follows [Feature Area] — [Specific behaviour] pattern
- [ ] User story has all three parts including "so that"
- [ ] AC exists as numbered testable items (not prose)
- [ ] AC covers happy path
- [ ] AC covers at least one error state with exact error message
- [ ] AC covers empty/zero state
- [ ] AC covers all modes if feature has modes
- [ ] Out of scope is explicitly listed
- [ ] Figma link attached and points to specific frame
- [ ] Feature URL in test environment is correct and accessible
- [ ] API endpoints listed (or "N/A — frontend only")
- [ ] Seed file path provided (or "N/A")
- [ ] Breaking changes flagged (or "No")
- [ ] Linked tickets reflect real dependencies
- [ ] Description matches comments (no conflicts)
- [ ] Definition of Done checklist is complete

If any item is unchecked → ticket is not ready for QA.
The AI pipeline will flag it as BLOCKED at intake.
