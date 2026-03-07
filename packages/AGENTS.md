# Packages Guidance

Packages contain shared logic used by multiple apps.

## Principles

- Keep packages framework-agnostic.
- Do not introduce React, Expo, or UI libraries in shared packages.
- Prefer pure TypeScript utilities, domain models, and API clients.
- Avoid runtime dependencies unless clearly justified.

## Structure

Typical packages include:

- `types` — domain entities and DTO contracts
- `api-client` — typed API requests
- `config` — shared constants and configuration helpers

## Rules

- Do not import from `apps/*`.
- Do not include UI logic.
- Keep dependencies minimal.
- Favor small focused modules.
