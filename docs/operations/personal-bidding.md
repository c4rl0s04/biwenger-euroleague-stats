---
title: Personal bidding workspace
description: Private live-market bids and one-shot remote execution.
audience:
  - operator
  - maintainer
status: active
---

# Personal bidding workspace

The private page is `/personal/bids`. Only the authenticated account matching
`BIWENGER_USER_ID` can load it or call its browser API routes. That account also needs
its encrypted personal Biwenger credential already stored in the application.
The page reads `/account` and `/market` live; the bid count is queried only when a
player is selected and only when the league permits a free Premium count.

## Remote scheduling

1. Apply migration `0021_natural_secret_warriors` following the [database safety](database-safety.md)
   backup and audit process. The table stores rule amounts and outcomes, never provider credentials.
2. Set `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, and
   `PERSONAL_BID_CALLBACK_URL` in the deployed server environment. The callback must be the
   exact public HTTPS URL ending in `/api/personal/bids/execute`.
3. Deploy the application. Verify the private page loads as the configured manager and is
   inaccessible to a different account. Verify the QStash callback rejects an unsigned POST.
4. Create a low-risk scheduled rule from the private page. Confirm it appears as pending,
   and confirm its final status after the due time. Do not reuse a listing that already has a bid.
5. Only after remote delivery has been verified, unload any old local LaunchAgent that could
   send a competing bid.

A rule fires 3–60 minutes before the observed listing close and can be created only if its
execution time is 1 minute to 7 days away. Seven days is the QStash free-tier delay limit.
The scheduling service checks that the bid-count endpoint is available without credit use.
At execution, it rereads the listing, skips if an own offer exists, fetches the current count,
selects one of the two amounts, and uses the Market command service to submit once.

The database atomically moves a pending rule to running before provider contact. Repeated
QStash delivery finds no pending rule and cannot send a duplicate. A `running` rule that
remains after an interruption may have an unknown provider outcome and must be checked in
Biwenger before any manual retry. An ambiguous network outcome is marked `uncertain`.
Cancellation updates the database; a later QStash delivery is harmless. QStash message
cancellation is not needed for correctness.

The schedule is intentionally one-shot. If Biwenger changes a listing, the user's existing
bid takes precedence, the count becomes unavailable, or the amount exceeds the new limit,
execution is skipped. The page displays the resulting status; there is no blind retry.
