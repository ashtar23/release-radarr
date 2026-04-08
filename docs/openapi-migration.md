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

1. Switch selected `@repo/api-client` transport types to generated OpenAPI types
2. Add a thin generated-client wrapper while preserving auth refresh behavior
3. Move `@repo/types` toward domain-only exports
4. Decide whether `/openapi.json` should stay enabled in production or remain internal-only

## Notes

- Web and mobile continue using Zod for form validation.
- API route schemas use TypeBox.
- Docs are internal-first: local/staging enabled, production disabled by default.
