---
title: Glossary
description: Shared terminology for fantasy basketball, providers, analytics, and project architecture.
audience:
  - newcomer
  - user
  - contributor
  - agent
status: active
---

# Glossary

| Term                 | Meaning                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Biwenger             | Private fantasy competition provider and the primary source of league, squad, market, and fantasy scoring data.      |
| EuroLeague           | Official basketball competition and source of schedules, teams, box scores, and match metadata.                      |
| Season fact          | A record whose meaning belongs to one fantasy season, such as ownership, lineup, price, transfer, or standings data. |
| Round                | A fantasy scoring period, commonly corresponding to a EuroLeague matchday.                                           |
| Lineup               | Players and roles selected by a fantasy manager for a round.                                                         |
| Captain              | A lineup role that modifies fantasy scoring according to game rules.                                                 |
| Market listing       | A player currently offered for sale, captured as a time-sensitive snapshot.                                          |
| Transfer (`fichaje`) | A completed ownership transaction recorded from the league board.                                                    |
| Porras               | Biwenger match-prediction pool records.                                                                              |
| Hoopgrid             | Daily grid trivia in which a player must satisfy row and column criteria.                                            |
| Rarity               | Hoopgrid popularity measure derived from how frequently a valid player is guessed.                                   |
| DAO / query layer    | Modules that isolate reads from PostgreSQL.                                                                          |
| Service layer        | Modules that apply business rules and combine data for routes or pages.                                              |
| Sync step            | Numbered ingestion unit registered with the guarded sync manager.                                                    |
| Advisory lock        | PostgreSQL lock that prevents overlapping sync or lifecycle operations.                                              |
| ADR                  | Architecture Decision Record documenting a consequential choice and its trade-offs.                                  |
