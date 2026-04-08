# Requirements: Soonr

**Defined:** 2026-03-17
**Core Value:** Users can reliably track the game releases they care about and get notified when something important changes.

## v1 Requirements

### Guest Search & Discovery

- [ ] **DISC-01**: Guest can search for games by name from both web and mobile clients
- [ ] **DISC-02**: Search results return normalized title summaries from the backend cache with RAWG fallback
- [ ] **DISC-03**: Guest can open a title detail view and see release/platform information
- [ ] **DISC-04**: Title detail requests return cached data when fresh and refresh stale metadata through the backend

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can sign in with email and password
- [ ] **AUTH-03**: User session persists across app relaunch/browser refresh
- [ ] **AUTH-04**: User can sign out from web and mobile clients

### Watchlist

- [ ] **WATCH-01**: Authenticated user can add a title to their watchlist
- [ ] **WATCH-02**: Authenticated user can remove a title from their watchlist
- [ ] **WATCH-03**: Authenticated user can view their watchlist on web and mobile
- [ ] **WATCH-04**: Watchlist entries are linked to cached titles and survive across sessions

### Notification Preferences

- [ ] **PREF-01**: Authenticated user can enable or disable `release_date_changed` notifications
- [ ] **PREF-02**: Authenticated user can enable or disable `release_approaching` notifications
- [ ] **PREF-03**: Authenticated user can choose supported timing presets for `release_approaching`
- [ ] **PREF-04**: Notification preferences persist in the backend and are available to both clients

### Notification Pipeline

- [ ] **NOTF-01**: Backend generates change events when a watched title's release date meaningfully changes
- [ ] **NOTF-02**: Backend generates approaching-release events for watched titles based on configured timing presets
- [ ] **NOTF-03**: Backend creates user-facing in-app notification records from generated events and user preferences
- [ ] **NOTF-04**: Authenticated user can view in-app notification records in web and mobile clients

### Mobile Push

- [ ] **PUSH-01**: Mobile app can register a device token for an authenticated user
- [ ] **PUSH-02**: Backend schema supports device token storage without blocking in-app notifications
- [ ] **PUSH-03**: Push delivery can send supported notification events after the in-app pipeline is working

## v2 Requirements

### Enrichment

- **ENR-01**: Enrich tracked titles with store pricing or storefront links
- **ENR-02**: Support preorder-specific alerts

### Expanded Scope

- **SCOPE-01**: Support movies / TV tracking in addition to games
- **SCOPE-02**: Add passkey authentication

### Administration

- **ADMIN-01**: Add admin/operational tooling for content and notification management

## Out of Scope

| Feature | Reason |
|---------|--------|
| Movies / TV in MVP | Product is explicitly game-only for the first release |
| Pricing and preorder tracking in MVP | Not required for core release-change tracking |
| Admin dashboards in MVP | Team should prioritize user-facing tracking workflows first |
| Passkeys in MVP | Email/password auth is already wired and sufficient for first release |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DISC-01 | Phase 1 | Complete |
| DISC-02 | Phase 1 | Complete |
| DISC-03 | Phase 1 | Complete |
| DISC-04 | Phase 1 | Complete |
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| WATCH-01 | Phase 2 | Pending |
| WATCH-02 | Phase 2 | Pending |
| WATCH-03 | Phase 2 | Pending |
| WATCH-04 | Phase 2 | Pending |
| PREF-01 | Phase 3 | Pending |
| PREF-02 | Phase 3 | Pending |
| PREF-03 | Phase 3 | Pending |
| PREF-04 | Phase 3 | Pending |
| NOTF-01 | Phase 4 | Pending |
| NOTF-02 | Phase 4 | Pending |
| NOTF-03 | Phase 4 | Pending |
| NOTF-04 | Phase 4 | Pending |
| PUSH-01 | Phase 5 | Pending |
| PUSH-02 | Phase 5 | Pending |
| PUSH-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 after initial definition*
