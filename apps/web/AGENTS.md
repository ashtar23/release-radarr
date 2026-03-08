# Web App Guidance

## Project overview

This directory contains the Vite + React web application.

Current structure includes:

- `src/main.tsx` as web entry point
- `src/App.tsx` as current root app component
- `src/assets` for static assets

The intended stack for this app includes:

- React 19
- Tailwind v4
- shadcn/ui
- TanStack Query
- React Hook Form

## Responsibilities

The web app is responsible for:

- guest search
- auth UI
- title details UI
- watchlist UI
- settings
- notification center

## Working agreements

- Prefer minimal, readable React components.
- Keep presentation logic in the web app and provider/backend logic outside it.
- Reuse shared contracts and API client packages rather than duplicating request logic.
- Do not hardcode API contract shapes in the app.
- Prefer composition over large components with mixed concerns.
- Preserve architecture boundaries and keep provider-specific logic out of UI components.

## Data and state conventions

- Prefer TanStack Query for server state, async fetching, caching, and mutations.
- Do not use `useEffect` for data fetching when TanStack Query is the correct tool.
- Avoid unnecessary `useEffect`; derive values during render when possible.
- Prefer local state only for simple UI-only interactions.
- Do not use ad hoc request state management when shared async patterns already exist.
- Follow modern React guidance: do not add `useEffect` by default.
- Avoid `useEffect` for derived state, event handling, or straightforward data flow that can be handled during render.
- Use `useEffect` only when synchronizing with external systems such as subscriptions, imperative APIs, timers, or browser APIs.
- If using `useEffect`, prefer explaining why it is necessary.

## Form conventions

- Prefer React Hook Form for non-trivial forms such as auth, settings, and other structured inputs.
- Avoid `useState`-heavy form state and validation when React Hook Form is more appropriate.
- Keep validation logic close to the form and aligned with shared contracts where practical.
- Use controlled abstractions only when they are actually needed.

## UI conventions

- Prefer Tailwind v4 for styling.
- Use official shadcn/ui setup and CLI-managed components where appropriate.
- Do not hand-roll shadcn lookalikes when the real shadcn component should be installed instead.
- Prefer shadcn/ui primitives with Radix UI under the hood and lucide-react for icons where appropriate.
- Avoid plain CSS files or ad hoc styling unless explicitly justified.
- Prefer shared utility classes and consistent spacing/token usage over one-off values.
- Keep components small, composable, and easy to review.

## Structure conventions

- Prefer a practical feature-first or route-first structure.
- Do not force atomic design naming unless explicitly requested.
- Reusable low-level UI primitives may live in a shared UI area, but avoid ceremony-heavy folder structures without clear benefit.

## Verification

After changes:

- run lint for the web app
- run type checks for the web app
- explain any commands not run
