# Notification Design

## Scope

MVP notification delivery is in-app first, with Expo push added shortly after the in-app pipeline is stable.

## Event types

Supported MVP events:

- `release_date_changed`
- `release_approaching`

## Data model (MVP)

The backend should persist:

- notification preferences per user
- generated notification events
- notification records visible in-app
- device tokens (schema-ready in MVP, push delivery can follow)

## Generation flow

1. title release data changes or scheduled checks run
2. backend evaluates whether an event should be emitted
3. event is persisted
4. user-specific notification records are created according to preferences
5. clients read notification records from Supabase-backed endpoints

## Delivery order

1. in-app notification records
2. mobile push delivery via Expo

Clients remain presentation-focused and must not directly call external providers.
