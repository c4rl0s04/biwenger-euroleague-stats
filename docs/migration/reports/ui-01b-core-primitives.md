---
title: UI-01B Core UI Primitives
description: Core foundation primitives, token layering, contrast resolution and acceptance evidence.
audience:
  - maintainer
  - agent
status: active
---

# UI-01B — Core UI Primitives

Base: `0b001b17`.
Branch: `refactor/ui-core-primitives`.
PR: [#44](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/44).
Merged commit: `665fd1d78f341adcbaed38e3aa413b5b6ba78434`.
State: Integrated into `main`.

## Scope and purpose

`UI-01B` implements the core primitive layer of the design-system migration (`tokens` → `primitives` → `controls` → `compositions` → `screens`).

This slice creates exactly six domain-independent UI primitives under `src/components/ui/primitives/`, backed by semantic tokens and exposed through the opt-in foundation entrypoint `@/components/ui/foundation`.

### 1. Primitives implemented

1. **`Button` (`src/components/ui/primitives/Button.tsx`)**:
   - Native `<button>`, default `type="button"`, preserves explicit `type="submit"`.
   - Variants: `primary`, `secondary`, `ghost`.
   - Sizes: `sm` (32px), `md` (44px canonical touch target), `lg` (48px).
   - Visible focus rings: `focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus-ring))]`.
   - Native disabled behavior, reduced-motion compliance (`motion-reduce:transition-none`).
   - Ref forwarding to `HTMLButtonElement`.
   - No loading, href, icon, asChild, or theme props.

2. **`IconButton` (`src/components/ui/primitives/IconButton.tsx`)**:
   - Strict square 1:1 aspect ratio (`h-8 w-8`, `h-11 w-11`, `h-12 w-12`).
   - Variants: `secondary` (default), `primary`, `ghost`.
   - Compile-time TypeScript discriminated union requiring `aria-label` or `aria-labelledby`.
   - Runtime development warning if accessible name is omitted.
   - Ref forwarding to `HTMLButtonElement`.

3. **`Input` (`src/components/ui/primitives/Input.tsx`)**:
   - Native `<input>`, default `type="text"`.
   - Canonical 44px (`h-11`) height.
   - Consumes semantic form control tokens (`bg-[hsl(var(--control-surface))]`, `text-[hsl(var(--control-content))]`, `placeholder:text-[hsl(var(--control-placeholder))]`).
   - Accessible invalid state: `aria-invalid="true"` drives danger border and focus ring (`border-[hsl(var(--status-danger))]! ring-[hsl(var(--status-danger))]`).
   - Ref forwarding to `HTMLInputElement`.
   - Excludes label, description, error text, validation logic, password controls, or form state.

4. **`Badge` (`src/components/ui/primitives/Badge.tsx`)**:
   - Native `<span>`, pill geometry (`rounded-full px-2.5 py-0.5`).
   - Variants: `neutral`, `accent`, `danger`.
   - Non-interactive status token wrapper; domain-independent.

5. **`Avatar` (`src/components/ui/primitives/Avatar.tsx`)**:
   - Circular frame (`sm` 32px, `md` 40px, `lg` 48px).
   - Native `<img>` with `loading="lazy" decoding="async"` when `src` is provided.
   - Centered fallback initials when `!src`, with accessible `role="img"` and `aria-label`.
   - Domain-independent; does not derive initials from users, players, or managers internally.

6. **`Skeleton` (`src/components/ui/primitives/Skeleton.tsx`)**:
   - Layout-neutral visual placeholder with default `aria-hidden="true"`.
   - Background: `bg-[hsl(var(--surface-secondary))]`.
   - Smooth pulse animation: `animate-pulse motion-reduce:animate-none`.
   - Supports explicit prop overriding (`aria-hidden={false}`) when deliberately accessible.

---

## Token architecture & defect resolutions

### Circular `--radius-control` resolution

The base token and semantic token were decoupled to prevent custom-property circular references:

- **Base token (`src/styles/tokens/base-tokens.css`)**:
  ```css
  --radius-compact: 0.5rem;
  ```
- **Semantic token (`src/styles/tokens/semantic-tokens.css`)**:
  ```css
  --radius-control: var(--radius-compact);
  ```
- Shape tokens remain theme-independent and are not duplicated in theme-specific override blocks.

### Primary action contrast resolution (WCAG 2.2 AA)

The legacy primary action color `#fa5001` with white text fails WCAG AA (~2.9:1).
To resolve this without altering legacy `--primary-foreground`:

- Added `--action-primary-content` semantic role:
  - **Dark theme:** `--color-obsidian-black` (`#0c0c0e`) on `#fa5001` → **6.35:1 contrast** (passes WCAG AA $\ge 4.5:1$).
  - **Light theme:** `--color-white-pure` (`#ffffff`) on `#c43800` (`--color-orange-ink`) → **5.83:1 contrast** (passes WCAG AA $\ge 4.5:1$).

### Control tokens

- `--control-surface`: soft container background for form controls.
- `--control-content`: high-contrast text within form controls.
- `--control-placeholder`: accessible muted placeholder color.
- `--control-border`: accessible border color for form controls.

---

## Server Component compatibility & legacy isolation

- **Zero `'use client'` directives** in `src/components/ui/primitives/` or `src/components/ui/foundation.ts`.
- **Zero React Hooks** (`useState`, `useEffect`, `useContext`, `useTheme`) inside primitives.
- Primitives render seamlessly in both React Server Component (RSC) and Client Component trees.
- Legacy barrel `@/components/ui/index.js` and existing components (`UserAvatar.js`, `LoadingSkeleton.js`, `CustomSelect.js`, `BackButton.js`, legacy `Card`) remain **100% untouched**.
- No premature migrations of existing feature pages.

---

## Verification evidence

1. **Focused unit and contract tests:**
   - `src/components/ui/foundation.test.tsx`: **68 / 68 passed** (HTML semantics, ref forwarding, `aria-invalid`, `aria-label` discriminated union, accessible overrides, and RSC boundary assertions).
   - `src/lib/theme/theme.test.tsx`: **18 / 18 passed** (system/dark/light resolution, storage fallback, hydration reconciliation, theme independence of radius tokens).
2. **Playwright E2E browser tests (`tests/e2e/application-theme.spec.ts`):**
   - **65 passed, 0 failures** across all 9 device viewports (`desktop-1440`, `desktop-1280`, `tablet-768`, `iphone-13`, `iphone-se`, `pixel-7`, `android-compact`, `iphone-15-pro-max`, `iphone-13-landscape`).
   - Verified computed border-radius equals `8px` (`0.5rem`) for Button, IconButton, Input, and Skeleton in both themes.
   - Verified primary button text contrast $\ge 4.5:1$ in both themes.
   - Verified canonical touch target heights $\ge 44$px for medium controls.
3. **Full repository verification (`npm run verify`):**
   - `skills:check`: Passed (6 repository skills valid).
   - `architecture:check`: Passed (1,011 modules, 86 protected entrypoints).
   - `docs:check`: Passed (All notes formatted).
   - `typecheck`: Passed (0 errors).
   - `lint`: Passed (0 errors).
   - `build`: Passed (`next build` production bundle succeeded).
   - `db:audit:schema:metadata`: Passed (37/37 tables in sync).
   - `drizzle-kit check`: Passed ("Everything's fine 🐶🔥").
   - `git diff --check`: Clean.
