# Market Commands (Reserved Namespace)

This directory is reserved for private market mutation operations and command boundaries (Tasks 16 & 17):

- **Player Sales**: Listing players on the transfer market (`POST /api/market/sell`).
- **Transfer Decision**: Accepting or rejecting incoming bids/offers (`POST /api/market/offers/accept`, `POST /api/market/offers/reject`).
- **Auction Bids**: Submitting bids on live market auctions (`POST /api/market/bid`).

All command handlers in this directory must implement fail-closed retry policies, validate input schemas, enforce authenticated user session context, and guarantee zero credential leakage per `AGENTS.md`.
