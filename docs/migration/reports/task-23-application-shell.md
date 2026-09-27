---
title: Task 23 Application Shell Migration
description: Architectural migration of persistent application chrome to src/components/shell.
audience:
  - maintainer
  - agent
status: active
---

# Task 23 — Application Shell Migration

Base: `af55af80`.
Branch: `refactor/application-shell`.
State: Complete and verified on task worktree; prepared for PR review.

## Scope and purpose

Task 23 represents the **first production adoption of the new UI foundation** (`UI-00`, `UI-01A`, `UI-01T`, `UI-01B`, `UI-01H`).

Its purpose is to replace the legacy global application chrome under `src/components/layout/` with the documented target shell architecture under `src/components/shell/` while strictly preserving all routing, domain, authentication, navigation, accessibility, PWA, and data contracts.

## Architecture and components

The shell is structured into four explicit responsibility areas:

```text
src/components/shell/
├── shared/            # Shared primitives, providers, context, navigation model
├── desktop/           # Desktop shell layout, sidebar, header, footer
├── mobile/            # Phone/PWA shell layout, bottom nav, More menu dialog
└── integrations/      # Feature capability placements (Search, Season, Account)
```

### 1. Shared core (`src/components/shell/shared/`)

- **`navigation.ts`**: Canonical single source of truth for navigation destinations (16 items), mobile primary items (Inicio, Horario, Dashboard, Clasificación), `isNavigationItemActive` route matching, and mobile navigation categories.
- **`SectionContext.tsx`**: Typed section registration provider with DOM-ordered anchors (`requestAnimationFrame`) for dynamic in-page navigation.
- **`NavigationFeedback.tsx`**: Route transition progress bar and screen-reader polite status announcements (`role="status"`, `aria-live="polite"`).
- **`AppBrand.tsx`**: Accessible brand wordmark and logo via `next/image` with link to `/`.
- **`AppBackground.tsx`**: Quiet sports analytics canvas using semantic tokens (`--surface-app`, `--effect-shell-ambient-primary`, `--effect-shell-ambient-subtle`) without component-local `dark:` overrides.
- **`AppMain.tsx`**: Semantic `<main id="main-content" tabIndex={-1} className="app-main-content">` landmark.
- **`AppProviders.tsx`**: Replaces `ClientWrapper.js`, composing `UserProvider`, `SeasonProvider`, `ErrorBoundary`, and `CommandPalette` with strongly typed props.

### 2. Desktop shell (`src/components/shell/desktop/`)

- **`Sidebar.tsx`**: Desktop navigation with collapsible drawer using `<IconButton>` primitive, auto-collapse on tablet viewports (768px-1023px), and dynamic section sub-lists.
- **`AppHeader.tsx`**: Desktop header composing brand, global search, settings link, season selector, and account menu. Removed fake notifications UI (bell icon + pulsing dot).
- **`AppFooter.tsx`**: Semantic footer with valid GitHub repo link, clean navigation links, and copyright. Excludes fake interactive spans.
- **`DesktopShell.tsx`**: Orchestrates header, sidebar, news ticker (`@/features/news/public`), main content, and footer.

### 3. Mobile shell (`src/components/shell/mobile/`)

- **`MobileNavigation.tsx`**: Fixed bottom navigation bar with 4 primary destinations, active state styling, pending navigation spinner, stable `useCallback` for `onClose`, and "Más" button.
- **`MobileMoreMenu.tsx`**: Accessible dialog (`role="dialog"`, `aria-modal="true"`) with `<IconButton>` close button, Tab / Shift+Tab focus trap, Escape handling, body scroll lock, focus restoration, global search, season selector, and categorized navigation links.
- **`MobileShell.tsx`**: Orchestrates main content frame and mobile bottom navigation.

### 4. Integrations (`src/components/shell/integrations/`)

- **`AccountMenu.tsx`**: Replaces `UserSelector.js`. Cleaned up debug logging, preserved NextAuth `signOut` flow, and added client mount guard (`isClient`) to prevent React #418 hydration mismatches.
- **`GlobalSearch.tsx`**: Replaces `SearchDropdown.js`. Features 300ms debounce, keyboard navigation (ArrowUp/Down/Enter/Escape), type badges, and navigation feedback.
- **`SeasonSelector.tsx`**: Accessible trigger and dropdown using `useSeason()` context.
- **`CommandPalette.tsx`**: Replaces `src/components/ui/CommandPalette.js`. Global Cmd+K / Ctrl+K palette styled with semantic foundation tokens.

### 5. Root presentation dispatcher (`src/components/shell/AppShell.tsx`)

- Renders accessible skip-to-content link pointing to `#main-content`.
- Dispatches to `<MobileShell>` when `presentationMode === 'phone'` and `<DesktopShell>` otherwise.
- Sets root `data-presentation` attribute.

## Cleanups and deletions

### Obsolete files deleted

- `src/components/layout/AppShell.js`
- `src/components/layout/TopHeader.js`
- `src/components/layout/Sidebar.js`
- `src/components/layout/MobileNavigation.js`
- `src/components/layout/NavigationFeedback.js`
- `src/components/layout/navigation.js`
- `src/components/layout/navigation.test.ts`
- `src/components/layout/SearchDropdown.js`
- `src/components/layout/SeasonSelector.js`
- `src/components/layout/SettingsDropdown.js`
- `src/components/layout/Navbar.js`
- `src/components/layout/ClientWrapper.js`
- `src/components/layout/SectionContext.js`
- `src/components/user/UserSelector.js`
- `src/components/user/index.js` (and directory `src/components/user` removed)
- `src/components/ui/CommandPalette.js`

### Retained backward compatibility

- `src/components/layout/Section.js` & `src/components/layout/index.js` (re-exporting Section only): retained because 16 unmigrated feature pages consume `Section`.
- `src/components/ui/ThemeBackground.js` & `CardThemeContext.js`: retained for unmigrated profile pages.

## Verification evidence

1. **`npm run skills:check`**: PASS (6 repository skills valid).
2. **`npm run architecture:check`**: PASS (1,049 modules, 88 protected entrypoints, 0 violations).
3. **`npm run docs:check`**: PASS (116 vault notes verified).
4. **`npm run typecheck`**: PASS (0 errors).
5. **`npm run test:run`**: PASS (332 test files passed | 2 skipped, 2,687 tests passed | 2 skipped).
6. **`npm run lint`**: PASS (0 errors, 24 pre-existing warnings in unmigrated feature files).
7. **`npm run build`**: PASS (All 52/52 static pages generated, standalone server assets verified).
8. **`npm run db:audit:schema:metadata`**: PASS (37 source tables, 37 snapshot tables, 0 drift).
9. **`npx --no-install drizzle-kit check`**: PASS.
10. **`git diff --check`**: PASS (Clean whitespace, no conflicts).
11. **Playwright E2E browser suites (`npm run test:e2e:local`)**:
    - `tests/e2e/pwa-responsive.spec.ts`: 27/27 passed (100%).
    - `tests/e2e/application-theme.spec.ts`: 65/65 passed (100%).
    - `tests/e2e/home-architecture.spec.ts`: 10/10 passed (100%).
