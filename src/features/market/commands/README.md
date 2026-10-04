# Market Commands (Reserved Namespace)

This directory owns private market mutation operations and command boundaries:

- **Player Sales**: Listing players on the transfer market (`POST /api/market/sell`).
- **Transfer Decision**: Accepting or rejecting incoming bids/offers (`POST /api/market/offers/accept`, `POST /api/market/offers/reject`).
- **Auction Bids**: Submitting bids on live market auctions (`POST /api/market/bid`).

The live Biwenger market snapshot and on-demand bid count belong to `../live`. The purchase
command here refreshes that snapshot and validates the listing before submitting `/offers`.
No application `/api/market/bid` route exists yet; the path above is a reserved future adapter.

All command handlers in this directory must implement fail-closed retry policies, validate input schemas, enforce authenticated user session context, and guarantee zero credential leakage per `AGENTS.md`.
