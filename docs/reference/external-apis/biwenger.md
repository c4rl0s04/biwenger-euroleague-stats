---
title: Biwenger API
description: Authentication, endpoint families, retries, and database ownership for the unofficial Biwenger client.
audience:
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# Biwenger API

The project uses the unofficial `https://biwenger.as.com/api/v2` interface through
[`biwenger-client.js`](../../../src/lib/api/biwenger-client.js). It is an external dependency with no
repository-controlled compatibility guarantee.

## Request contract

The client sends a bearer token plus `X-League` and `X-User` headers. It discovers the current API
version from `/account`, caches it in memory, and appends it to normal requests. A configured
`BIWENGER_API_VERSION_FALLBACK` is used only if detection fails.

Normal reads use the server ingestion token. User-triggered market mutations use the requesting
manager's stored Biwenger token and identity.

The client delays each request by a random two-to-five-second interval and retries HTTP 429 up to
three times with exponential delay. Other non-success responses are surfaced with provider details.

## Endpoint families

| Family                  | Representative path                                      | Primary ownership                                  |
| ----------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| Account/version         | `/account`                                               | API version discovery                              |
| Competition master data | `/competitions/euroleague/data?lang=es`                  | Players, teams, rounds, current values             |
| League standings        | `/league/{leagueId}?fields=standings`                    | Users and standings                                |
| League board            | `/league/{leagueId}/board?offset={offset}&limit={limit}` | Transfers, bids, finances, predictions             |
| Round league data       | `/rounds/league/{roundId}`                               | Manager results and lineups                        |
| Round games             | `/rounds/euroleague/{roundId}?score=1`                   | Fantasy round/team IDs and official fantasy points |
| Player detail           | `/players/euroleague/{id}`                               | Biography, price history, and metadata enrichment  |
| User squad              | `/user/{id}?fields=players`                              | Current ownership                                  |
| Home and tournaments    | `/home`, `/tournaments/{id}`                             | Tournament discovery and structures                |
| Market                  | `/market`                                                | Current listings and user market actions           |
| Offers                  | `/offers/{id}`                                           | Accept/reject user offers                          |

Exact query fields are centralized in [`config.js`](../../../src/lib/config.js) and wrappers in the
client. The numbered steps map provider payloads into the tables described by the
[data model](../data-model.md).

## Failure handling

- Authentication errors require token/league/user validation; do not retry indefinitely.
- A 429 response is retried by the client. Avoid adding outer aggressive retry loops.
- Missing optional fields must not erase durable history.
- Provider ID/name mismatches are resolved through stored mappings and controlled matching logic,
  not by changing primary identities opportunistically.
- Log endpoint context, status, and sanitized details without bearer tokens or private payloads.
