# Roadmap: Soonr

**Created:** 2026-03-17
**Project:** Soonr
**Mode:** Brownfield MVP completion

## Summary

- **5 phases**
- **23 v1 requirements mapped**
- **Existing guest/auth/title flow treated as completed foundation**
- **Remaining roadmap focuses on personalized tracking and notifications**

## Phases

| #   | Phase                | Goal                                                                                        | Requirements                                                           | Status   |
| --- | -------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------- |
| 1   | Existing Foundation  | Confirm and preserve the currently working guest, search, title-detail, and auth baseline   | DISC-01, DISC-02, DISC-03, DISC-04, AUTH-01, AUTH-02, AUTH-03, AUTH-04 | Complete |
| 2   | Watchlist Core       | Add watchlist persistence and user-facing watchlist flows across backend, web, and mobile   | WATCH-01, WATCH-02, WATCH-03, WATCH-04                                 | Pending  |
| 3   | Preference Controls  | Let users manage notification preferences and timing presets from both clients              | PREF-01, PREF-02, PREF-03, PREF-04                                     | Pending  |
| 4   | In-App Notifications | Generate release events and turn them into in-app notification records and views            | NOTF-01, NOTF-02, NOTF-03, NOTF-04                                     | Pending  |
| 5   | Push Delivery        | Add mobile device registration and push delivery on top of the in-app notification pipeline | PUSH-01, PUSH-02, PUSH-03                                              | Pending  |

## Phase Details

### Phase 1: Existing Foundation

**Goal:** Preserve the already implemented guest browsing and auth baseline as the platform for the remaining MVP work.

**Requirements:** DISC-01, DISC-02, DISC-03, DISC-04, AUTH-01, AUTH-02, AUTH-03, AUTH-04

**Success Criteria:**

1. Guests can search for games from both clients and receive backend-served results.
2. Users can open title detail screens/pages and see normalized release/platform metadata.
3. Web and mobile auth flows support sign up, sign in, session restore, and sign out.
4. Shared packages remain the source of truth for API routes, config, and typed contracts.

### Phase 2: Watchlist Core

**Goal:** Introduce the first personalized tracking surface by persisting watched titles for authenticated users.

**Requirements:** WATCH-01, WATCH-02, WATCH-03, WATCH-04

**Success Criteria:**

1. Backend schema and policies persist watchlist entries for authenticated users.
2. Web and mobile title surfaces allow users to add/remove watched titles.
3. Users can view their current watchlist from dedicated screens/pages.
4. Watchlist state remains consistent across sessions and clients.

### Phase 3: Preference Controls

**Goal:** Give users control over which notification events they want and when they should trigger.

**Requirements:** PREF-01, PREF-02, PREF-03, PREF-04

**Success Criteria:**

1. Backend persists notification preference records per user.
2. Users can toggle the supported MVP event types.
3. Users can choose supported timing presets for approaching-release notifications.
4. Preference changes are reflected consistently in both clients.

### Phase 4: In-App Notifications

**Goal:** Build the core notification engine and expose notification records inside the product.

**Requirements:** NOTF-01, NOTF-02, NOTF-03, NOTF-04

**Success Criteria:**

1. Backend can detect meaningful release changes for watched titles and emit events.
2. Backend can generate approaching-release events using persisted preferences and timing presets.
3. User-specific in-app notification records are created and queryable.
4. Web and mobile clients can render an in-app notification center or list.

### Phase 5: Push Delivery

**Goal:** Extend the in-app notification pipeline to mobile push without changing the core event model.

**Requirements:** PUSH-01, PUSH-02, PUSH-03

**Success Criteria:**

1. Mobile app can register and update authenticated device tokens.
2. Backend schema and delivery flow can safely store and use device tokens.
3. Supported notification events can be delivered through Expo push after in-app records are created.

## Sequencing Notes

- Phase 2 must land before Phases 3 and 4 because notifications depend on tracked titles.
- Phase 3 should precede most Phase 4 work so the event pipeline has a stable preference model.
- Phase 5 depends on Phase 4; push is an additional delivery channel, not a separate notification model.
- Existing mobile UI work in progress should be reconciled carefully during execution because the branch already contains uncommitted changes in account/sheet/button areas.

## Current Recommendation

Start with **Phase 2: Watchlist Core**. It is the first unfinished capability that turns Soonr from browsing into tracking, and it unlocks the later notification phases.

---

_Roadmap created: 2026-03-17_
