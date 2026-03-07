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

## Routing and structure

- Routes should live in `src/app`.
- Shared UI belongs in `src/components`.
- Shared app constants belong in `src/constants`.
- Reusable hooks belong in `src/hooks`.

## Verification

After changes:

- run lint for the mobile app if configured
- run type checks for the mobile app if configured
- explain any commands not run
