---
title: Documentation Assets
description: Rules for images and exported diagrams used by project documentation.
audience:
  - contributor
  - maintainer
status: active
---

# Documentation assets

Keep only assets that are referenced by maintained documentation. Use descriptive lowercase
filenames, optimize binary files before committing them, and prefer Mermaid when a diagram does not
require a raster or vector export.

The [editable stack diagram](stack.html) is self-contained. After editing it, render its canvas
with Chromium and replace the [README export](stack.png). The README screenshots use the
disposable Playwright league on desktop and iPhone.

The README cover uses a generated arena background with project typography. The product collage
uses the committed desktop and mobile fixtures, which also remain available as full-size images.
