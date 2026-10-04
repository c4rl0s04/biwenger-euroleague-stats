---
title: Personal manual bidding
description: Private live-market page and immediate Biwenger bids.
audience:
  - operator
  - maintainer
status: active
---

# Personal manual bidding

The private page is `/personal/bids`. It is available only to the authenticated account matching
`BIWENGER_USER_ID`, which must already have a linked encrypted Biwenger credential in the
application. The server needs its existing credential keyring configuration. No new database
migration or scheduling service is needed for this manual phase.

The page fetches the account balance, maximum bid, and current market listings live from Biwenger.
Selecting a player requests the bid count only when it is available without spending credits. A
manual bid requires an explicit confirmation. The server checks the listing and existing offers
again immediately before sending it to Biwenger, so a changed listing or an existing own bid blocks
a duplicate offer.

After deployment, load the page as the configured manager, select a current listing, and verify its
balance, maximum bid, price, and own offer state. Check that another account cannot load the page
or use its API routes. Test one manual bid only when you intend to send a real offer; the confirmation
button sends it immediately.

Scheduled conditional bidding will be introduced separately after the manual page is verified.
