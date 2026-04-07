# Product Overview

## Purpose

Soonr helps users track upcoming game releases and receive notifications when important release changes occur.

The first version is focused on games only. Movies and TV may be added in later phases.

## Core guest flow

Guests can:

- search for games
- browse search results
- open title details
- view release information by platform

Guests cannot:

- maintain a watchlist
- configure notifications
- receive user-specific notifications

## Core authenticated flow

Authenticated users can:

- sign up and log in with email and password
- add titles to a watchlist
- remove titles from a watchlist
- configure notification preferences
- view in-app notifications
- receive push notifications on mobile

## Notification events

The MVP supports:

- `release_date_changed`
- `release_approaching`

## Notification timing options

Users can choose sensible presets such as:

- on the day
- 24 hours before
- 7 days before
- 30 days before

## Non-goals for MVP

The following are intentionally out of scope for the first phase:

- movies / TV support
- store pricing and preorder tracking
- advanced admin tooling
- passkey authentication

## Future phases

Potential future work:

- ITAD/store enrichment
- preorder alerts
- movies / TV support
- passkeys
- richer release scheduling controls
