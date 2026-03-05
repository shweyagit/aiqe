# Coverage Decision Rules

How to decide which test layer covers which AC item.
Every decision must be justifiable. "Because I felt like it" is not a reason.

---

## The Layer Decision Framework

Ask these questions in order for every AC item:

```
1. Does this require a real browser and user interaction to verify?
   YES → E2E (Playwright)

2. Does this require validating an API request or response?
   YES → API (PactumJS) — can be in addition to E2E

3. Does this require two or more services communicating?
   YES → Integration

4. Can this be verified by rendering a single component in isolation?
   YES → Component (Playwright CT)
   (only if it does NOT need the full page/navigation/session)

5. Does this require checking load behaviour under concurrent users?
   YES → Performance (k6)
```

Most AC items need more than one layer. That is correct.
The layers are not mutually exclusive.

---

## Layer Definitions

### E2E (Playwright) — /e2e/
Tests the complete user journey through the real browser.
Requires navigation, session state, real API calls.

**Use for:**
- User-facing interactions (click, type, select, drag)
- Multi-step flows (add to cart → checkout → confirmation)
- State changes visible in the UI
- Cross-page flows (redirect after login)
- Session persistence (refresh, navigate away and back)
- Error states that require user action to trigger

**Do NOT use for:**
- API shape validation (too slow, too brittle)
- Isolated component rendering (overkill)
- Load testing (wrong tool)

### API (PactumJS) — /api/
Tests HTTP endpoints directly. No browser. No UI.

**Use for:**
- Request shape validation (correct fields, types, required vs optional)
- Response shape validation (correct fields, types, values)
- Auth: with token / without token / expired token / wrong role
- Status codes for all scenarios (200/201/400/401/403/404/409/422/500)
- Contract testing (schema doesn't break between versions)
- Edge cases on input (max length, special characters, null values)
- Error response bodies (correct error codes and messages)

**Do NOT use for:**
- User journey testing
- UI state verification
- Tests that depend on frontend logic

### Integration — /integration/
Tests that two or more services or systems work correctly together.
No browser needed.

**Use for:**
- Service A calls Service B — result propagates correctly
- Event-driven flows (action triggers event → downstream system updates)
- Data consistency across services
- Rollback on partial failure

**Do NOT use for:**
- Single-service API testing (use API layer)
- UI testing (use E2E)
- Component rendering (use Component)

### Component (Playwright CT) — /component/
Renders a single UI component in isolation. No full page load.

**Use for:**
- Visual rendering of a component in each state
  (default, hover, active, error, empty, loading, disabled)
- Props produce correct output
- Event handlers fire correctly (onClick, onChange)
- ARIA attributes on a single component
- Colour rendering (e.g., flag badge colour normalisation)
- Tooltip content
- Responsive behaviour of a single component

**Do NOT use for:**
- Anything requiring navigation or session
- Anything requiring API calls (mock them instead)
- Full user journeys

---

## Decision Examples

### ✅ RIGHT decisions with reasons

```
AC: "Clicking an unflagged flag cell applies Category 1 badge"
  → E2E: user clicks in browser, badge must render
  → API: POST /flags must return 201 with correct shape
  Layer: E2E + API ✓

AC: "POST /flags without auth token returns 401"
  → API only: no UI involvement, pure API contract
  Layer: API ✓

AC: "Flag badge renders #E53935 colour for Category 1"
  → Component: isolated colour rendering, no need for full page
  Layer: Component ✓

AC: "Payment service receives order confirmation from Order service"
  → Integration: two services communicating
  Layer: Integration ✓

AC: "After page refresh, flags persist"
  → E2E: requires browser refresh and re-render
  → API: GET /flags must return same items after refresh
  Layer: E2E + API ✓
```

### ❌ WRONG decisions with reasons

```
AC: "POST /flags returns correct response shape"
  → E2E only ✗
  Reason: E2E tests this indirectly but cannot assert on response shape.
  A broken response shape might not break the UI immediately.
  Use API layer for contract assurance.

AC: "User clicks through all 8 flag categories"
  → Component only ✗
  Reason: This requires a real session, a real list, real API calls.
  Component tests render in isolation — no API, no session.
  Use E2E.

AC: "Flag badge renders correct colour"
  → E2E only ✗
  Reason: E2E can verify this, but it's overkill.
  A component test is faster, more focused, and fails more clearly.
  Use Component + E2E for the full cycle (Component for rendering,
  E2E for the click interaction that applies the flag).
```

---

## Priority Assignment Rules

### P1 — Run on every PR, block merge if failing
```
- Core user journeys (the primary "happy path" from ticket AC)
- Any flow involving money, auth, or data loss
- API contract tests (schema must not break)
- Regression tests for adjacent features
```

### P2 — Run nightly or pre-release
```
- Edge cases
- Negative/error state tests
- Component tests for non-critical states
- Secondary user journeys
```

### P3 — Run on demand or pre-major release
```
- Accessibility
- Visual/cosmetic checks
- Exploratory scenarios not in AC
- Performance baselines
```

---

## Coverage Anti-Patterns

### Anti-pattern 1: Testing everything at E2E
All tests are E2E. Suite takes 40 minutes to run.
Developers stop running it. Coverage is theoretically high
but practically useless.

Fix: Push API and component test coverage down to the right layer.
E2E should only test what REQUIRES a browser.

### Anti-pattern 2: Testing nothing at API
E2E passes. API returns wrong response shape.
Frontend is forgiving and renders anyway.
Another consumer of the API breaks silently.

Fix: Every endpoint gets API tests. Always.

### Anti-pattern 3: Component tests duplicating E2E
Component tests check button state.
E2E tests also check button state as part of the flow.
Both fail when the button changes. Fix in two places.

Fix: Component tests own isolated rendering.
E2E tests own the interaction and outcome.
They should not assert the same things.

### Anti-pattern 4: No integration tests
Services pass individually.
They fail in combination.
Nobody finds out until staging or production.

Fix: At least one integration test per service boundary
     touched by the feature.
