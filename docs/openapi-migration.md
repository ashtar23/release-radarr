# OpenAPI Migration

This document tracks the phased migration from handwritten API contracts to
schema-backed OpenAPI generation in `apps/api`.

## Goal

- make Fastify route schemas the contract source of truth
- expose interactive docs from the API
- generate client/types from the OpenAPI spec
- gradually reduce handwritten DTO and client duplication

## Current Status

Implemented:

- Swagger/OpenAPI foundation in `apps/api`
- `/docs` and `/openapi.json`
- generated spec and type flow:
  - `pnpm --filter api generate:openapi-spec`
  - `pnpm generate:api-types`
  - output: `packages/api-client/src/generated/openapi.ts`
- generated HTTP response aliases in `packages/api-client/src/openapi-types.ts`
- a thin internal OpenAPI helper layer in `packages/api-client/src/openapi-client.ts`
- schema-backed `@repo/api-client` HTTP slices for:
  - `home`
  - `titles`
  - `watchlist`
  - `notifications`
- `@repo/types` reduced toward domain/input concerns instead of owning API result wrappers
- `check:api-types` verification to catch stale generated contract files
- current schema-backed routes:
  - `GET /health`
  - `GET /home/discovery`
  - `GET /titles`
  - `GET /titles/:titleId`
  - `GET /watchlist`
  - `GET /watchlist/:titleId`
  - `POST /watchlist`
  - `DELETE /watchlist/:titleId`
  - `GET /notifications/unread-count`
  - `GET /notifications`
  - `GET /notification-preferences`
  - `POST /notifications/read`
  - `POST /notifications/read-all`
  - `PUT /notification-preferences`

Remaining:

1. Keep expanding schema coverage for any new HTTP routes so `/openapi.json` stays authoritative for the REST surface
2. Decide whether `/openapi.json` should stay enabled in production or remain internal-only
3. Decide whether health should move off the last handwritten runtime guard path
4. Consolidate any remaining transport/result naming drift as future routes are added

## Notes

- Web and mobile continue using Zod for form validation.
- API route schemas use TypeBox.
- Docs are internal-first: local/staging enabled, production disabled by default.
- Realtime websocket notifications at `/notifications/stream` are intentionally outside the current OpenAPI contract.
- `@repo/api-client` uses generated OpenAPI types plus a thin internal helper layer rather than a third-party generated fetch client.
