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

## UI conventions

- Prefer shadcn/ui patterns once added.
- Prefer shared design tokens and utility classes over ad hoc styling.
- Keep components small and composable.

## Verification

After changes:

- run lint for the web app
- run type checks for the web app
- explain any commands not run
