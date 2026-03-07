# Mobile App Guidance

## Project overview

This directory contains the Expo SDK 55 mobile application.

Current app structure includes:

- `src/app` for Expo Router routes/layouts
- `src/components` for shared UI components
- `src/constants` for tokens/constants
- `src/hooks` for reusable hooks

## Responsibilities

The mobile app is responsible for:

- auth UI
- search UI
- title details UI
- watchlist UI
- theme/settings UI
- notification center
- push token registration later

## Working agreements

- Preserve Expo SDK 55 compatibility.
- Prefer Expo-first solutions where possible.
- Do not add native dependencies unless explicitly asked.
- Reuse existing components/hooks before creating new ones.
- Keep components focused and presentation-oriented.
- Avoid embedding provider/backend logic directly in screens.
- Preserve clear ownership between UI, hooks, and backend-facing logic.

## Data and state conventions

- Prefer predictable state flow and readable component structure.
- Avoid unnecessary `useEffect`; derive values during render when possible.
- Do not use `useEffect` for async server state if a dedicated server-state pattern is in place.
- Prefer local state only for simple UI-only interactions.
- Keep async and backend-facing logic in dedicated hooks/services instead of screens.
- Follow modern React guidance: do not add `useEffect` by default.
- Avoid `useEffect` for derived state, event handling, or straightforward data flow that can be handled during render.
- Use `useEffect` only when synchronizing with external systems such as subscriptions, imperative APIs, timers, native APIs, or other external systems.
- If using `useEffect`, prefer explaining why it is necessary.

## Form conventions

- Keep forms simple and explicit.
- Prefer reusable form patterns when the same interaction appears in multiple places.
- Avoid overly stateful forms with scattered validation/error handling.

## Routing and structure

- Routes should live in `src/app`.
- Shared UI belongs in `src/components`.
- Shared app constants belong in `src/constants`.
- Reusable hooks belong in `src/hooks`.

## UI conventions

- Prefer existing app patterns, shared components, and design tokens before introducing new UI structures.
- Keep screens focused on composition and presentation.
- Avoid mixing styling, data orchestration, and navigation logic in the same component.

## Verification

After changes:

- run lint for the mobile app if configured
- run type checks for the mobile app if configured
- explain any commands not run
