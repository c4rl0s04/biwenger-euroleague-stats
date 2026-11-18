---
title: Documentation Assets
description: Rules for images and exported diagrams used by project documentation.
audience:
  - contributor
  - maintainer
status: active
---

# Documentation assets

Keep assets referenced by maintained documentation. Use descriptive lowercase filenames, optimize
binary files before committing them, and prefer Mermaid for simple flows that need no export.

- [README data flow source](stack.html) and [export](stack.png) show the route from league data to analytics.
  Render the `main` element at desktop width after editing.
- [Detailed architecture source](stack-detail.html) and [export](stack-detail.png) show runtime and automation
  connections. Render the sheet with the legend when updating the export.
- [Desktop dashboard](dashboard-desktop.png) and [mobile comparison](compare-mobile.png) use a disposable
  Playwright league. The [product composition](product-showcase.webp) places those captures over an illustrated arena background.
