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

- [README architecture source](stack.html) produces the [desktop](stack.png) and
  [mobile](stack-mobile.png) exports. Render its `main` element at viewport widths of 1120 px and 480 px.
- [Detailed architecture source](stack-detail.html) and [export](stack-detail.png) show runtime and
  automation connections. Render the sheet with the legend when updating the export.
- The [dashboard](dashboard-desktop.png), [mobile Home screen](home-mobile.png), and
  [market trends](market-trends.webp) use disposable Playwright league data. The Home image shows the full iPhone 13 viewport.
  The market image comes
  from the [populated market snapshot](../../tests/e2e/market-populated.spec.ts-snapshots/market-populated-trends-chart-desktop-1440-darwin.png).
