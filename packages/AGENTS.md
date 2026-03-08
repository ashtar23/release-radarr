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
- Do not include React hooks in shared packages unless the package is explicitly intended to be React-specific.
- In api-client, prefer plain typed request functions and do not embed framework-specific caching or React hooks.
- Workspace TypeScript packages are source-exported and consumed by bundlers/transpilers.
- Prefer bundler-style TypeScript resolution for shared app workspace packages.
- Do not use `.js` suffixes in internal TypeScript relative imports unless the package explicitly targets NodeNext runtime behavior.
