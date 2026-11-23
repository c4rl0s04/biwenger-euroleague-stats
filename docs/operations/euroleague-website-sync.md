---
title: EuroLeague Official Website Sync
description: Collect official player portraits and team crests and synchronize them into PostgreSQL.
audience:
  - operator
  - maintainer
  - contributor
  - agent
status: active
---

# EuroLeague official website sync

The [collector](../../scripts/euroleague/collect.ts) visits EuroLeague team rosters and player profiles
and builds a collection keyed by official codes extracted from their URLs. The
[synchronizer](../../scripts/euroleague/sync.ts) validates the images and updates existing official
records by season, provider and code. The routine API sync owns the links to the fantasy catalogue.

- Player portraits can be applied to confirmed and pending official profiles. Unknown codes appear
  in the report and can be retried after the official API catalogue is refreshed.
- Shared player silhouettes and images that fail validation leave the stored URL and provenance intact.
- A validated website portrait takes precedence over the API image. A JSON null in legacy
  `website_image` metadata allows the API to supply a portrait.
- Team crests retain provider crop parameters. Thumbnail transforms are removed, and raster crests
  must be at least 128 × 128 pixels. SVG crests are validated as scalable images.
- The apply step uses a transaction and the synchronization advisory locks.

## Run locally

1. Run `npm run sync:euroleague:collect` to refresh the roster collection.
2. Run `npm run sync:euroleague` to validate images and review the dry-run report and manifest.
3. Run `npm run sync:euroleague:apply` to validate and apply the current collection.

To use a collection outside the repository, pass `-- --output <path>` to collection and
`-- --input <path>` to preview and apply.

## Run on GitHub Actions

Run **EuroLeague Website Sync** manually. **dry-run** validates the committed collection, **apply**
validates and applies it, and **collect-and-apply** scrapes the latest rosters, applies the images,
and commits the updated collection.
