# API Spike

Minimal Fastify backend for testing whether a long-lived API gives better and
more consistent latency than the current Supabase Edge Functions path.

## Initial scope

- `GET /health`
- `GET /home/discovery`

## Local env

Copy `.env.example` to `.env` and provide:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAWG_API_KEY`

Optional:

- `PORT`
- `HOST`
- `APP_ENV`

## Local dev

```bash
pnpm --filter api dev
```

## Railway envs

Create at least:

- `staging`
- `production`

Set these variables in each environment:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAWG_API_KEY`
- `APP_ENV`
- `PORT` (Railway usually injects this automatically)

## Railway deploy

1. Create a new Railway service from this repo.
2. Set the root directory to `apps/api`.
3. Railway should detect the Node service automatically.
4. Set the environment variables above in `staging` first.
5. Deploy and confirm `GET /health` works before wiring mobile.

Recommended start command:

```bash
pnpm start
```

Recommended health check path:

```text
/health
```

## Mobile spike env

In the mobile app env, set:

- `EXPO_PUBLIC_HOME_API_BASE_URL=https://your-railway-service.up.railway.app`

Leave it unset to keep `home/discovery` on Supabase Functions.

## Goal of the spike

Point only mobile `home/discovery` at this service first, compare latency, then
decide whether more endpoints are worth migrating.
