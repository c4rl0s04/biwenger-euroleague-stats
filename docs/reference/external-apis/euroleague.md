---
title: EuroLeague APIs
description: Official team, schedule, header, and box-score endpoints used during synchronization.
audience:
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# EuroLeague APIs

[`euroleague-client.js`](../../../src/lib/api/euroleague-client.js) consumes two public official API
families and normalizes their results for sync.

## Endpoints

| Data        | Endpoint                                                                            | Format        |
| ----------- | ----------------------------------------------------------------------------------- | ------------- |
| Teams       | `https://api-live.euroleague.net/v1/teams?seasonCode={EYYYY}&competitionCode=E`     | XML           |
| Schedule    | `https://api-live.euroleague.net/v1/schedules?seasonCode={EYYYY}&competitionCode=E` | XML           |
| Box score   | `https://live.euroleague.net/api/Boxscore?gamecode={code}&seasoncode={EYYYY}`       | JSON or empty |
| Game header | `https://live.euroleague.net/api/Header?gamecode={code}&seasoncode={EYYYY}`         | JSON or empty |

The client uses `fast-xml-parser` for v1 XML and preserves string attributes so identifiers with
leading zeros are not coerced. A schedule with one item is normalized to an array.

## Request and retry behavior

Requests include a browser-like user agent, wait 300 ms before sending, and retry network failures
or HTTP 500/502/503/504 up to three times with exponential delay. Normal 4xx responses are not
retriable. Empty box-score/header responses for future games resolve to no data rather than a fake
completed record.

## Identity mapping

EuroLeague player codes and team codes are matched to Biwenger identities during master-data sync.
Player names are normalized from `LASTNAME, FIRSTNAME`, case-folded, and stripped of accents as one
matching aid. Persisted provider mappings take precedence over repeated fuzzy matching.

Box-score parsing skips `DNP` entries and maps official fields into `player_round_stats`. The match
and stats services can supplement official data with Biwenger round data, but the sources remain
distinguishable during transformation.

## Website scraping

Team logos and attempted official player images use public EuroLeague website profiles outside the
API client. The player-image source is currently blocked, so numbered step 11 is skipped in normal
pipeline runs. Treat HTML scraping as less stable than the API endpoints and avoid making it a
critical dependency.
