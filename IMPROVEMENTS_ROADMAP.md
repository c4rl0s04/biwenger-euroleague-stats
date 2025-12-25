# Biwenger Stats - Future Improvements Roadmap

## Current Grades (After Round 1 Improvements)

| Category        | Grade | Target |
| --------------- | ----- | ------ |
| Architecture    | A     | A+     |
| Code Quality    | A     | A+     |
| Consistency     | A+    | A+ ✓   |
| Professionalism | A     | A+     |
| Documentation   | A-    | A+     |
| Security        | A-    | A+     |
| Test Coverage   | C+    | A+     |
| Performance     | A     | A+     |

---

## 1. Architecture (A → A+) ✅ COMPLETE

- [x] Add barrel exports for components (`components/index.js`) ✓
- [x] Create shared type definitions (JSDoc typedefs in types.js) ✓
- [x] Add service layer between API routes and queries ✓
- [x] Migrate all 32 API routes to use service layer ✓

---

## 2. Code Quality (A → A+)

- [x] Apply response utility to ALL remaining API routes ✓
- [x] Import and use normalize-rounds.js in sync/index.js ✓
- [x] Add useApiData hook to data-fetching client components ✓
- [x] Extract magic numbers to constants file ✓
- [x] Add PropTypes validation to components ✓

---

## 3. Consistency (A+ ✓)

Already complete! Maintain by:

- Following established patterns for new code
- Documenting patterns in CONTRIBUTING.md

---

## 4. Professionalism (A → A+)

- [x] Add Prettier configuration ✓
- [x] Add pre-commit hooks (husky + lint-staged) ✓
- [x] Add GitHub Actions CI/CD pipeline ✓
- [ ] Start TypeScript migration (new files only)

---

## 5. Documentation (A- → A+) ✅ COMPLETE

- [x] Add JSDoc return types to query functions ✓
- [x] Create API documentation (API.md - 32 endpoints) ✓
- [x] Add database schema diagram (DATABASE.md with Mermaid ERD) ✓
- [x] Document components with usage examples (COMPONENTS.md) ✓
- [x] Improve .env.example with detailed comments ✓
- [x] Update README with documentation links ✓

---

## 6. Security (A- → A+)

- [ ] Apply validation.js to ALL API routes with parameters
- [ ] Add rate limiting middleware
- [ ] Add CORS configuration for production
- [ ] Add security event logging
- [ ] Add input sanitization for XSS prevention

---

## 7. Test Coverage (C+ → A+) ⚠️ PRIORITY

- [x] Fix failing sync-players.test.js ✓
- [x] Add tests for validation.js (19 tests) ✓
- [x] Add tests for response.js (10 tests) ✓
- [x] Add tests for normalize-rounds.js (11 tests) ✓
- [x] Add integration tests for API response utilities ✓
- [x] Add tests for thresholds.js constants (18 tests) ✓
- [x] Add tests for colors.js utilities (9 tests) ✓
- [ ] Add component tests for StreakCard
- [ ] Add test coverage reporting
- [ ] Reach 80%+ coverage

---

## 8. Performance (A → A+)

- [x] Apply caching to ALL read-only API endpoints ✓
- [x] Add database indexes for common queries ✓
- [x] Add React.memo to expensive components ✓
- [x] Add lazy loading for below-the-fold cards ✓
- [x] Use next/image for user avatars ✓
- [x] Run bundle analyzer to check dependencies ✓

---

## Quick Wins (Do First)

| Task                                  | Time   | Category |
| ------------------------------------- | ------ | -------- |
| Fix failing test                      | 15 min | Tests    |
| Apply response.js to remaining routes | 30 min | Quality  |
| Add tests for new utilities           | 45 min | Tests    |
| Add Prettier config                   | 10 min | Prof.    |
| Add database indexes                  | 20 min | Perf.    |

---

## Progress Tracking

### Completed ✓

- [x] Created validation.js utility
- [x] Created response.js utility
- [x] Consolidated streak cards → StreakCard.js
- [x] Created normalize-rounds.js helper
- [x] Created LoadingSkeleton.js component
- [x] Added null-safety to UserContext
- [x] Updated vitest config for all test dirs
- [x] Applied caching to 3 endpoints
- [x] Added validation to market route
- [x] Refactored 10 dashboard components to useApiData
- [x] Fixed useApiData infinite loop bug
- [x] Fixed sync-players.test.js (added mocks)
- [x] Added Prettier configuration
- [x] Created /api/league-average route
- [x] Added tests for validation.js (19 tests)
- [x] Added tests for response.js (10 tests)
- [x] Added tests for normalize-rounds.js (11 tests)
- [x] Applied response utility + caching to ALL 32 API routes
- [x] Added 19 database indexes for common query patterns
- [x] Added PropTypes to key UI components (LoadingSkeleton, StandardCard, StreakCard)
- [x] Added React.memo to PremiumCard and StandingsTable
- [x] Added lazy loading for 7 dashboard cards (NextRound, TopPlayers, Market, Birthday, MVPs, Streak, IdealLineup)
- [x] Created UserAvatar component with next/image optimization (3 components updated)
- [x] Added @next/bundle-analyzer with npm run analyze script
- [x] Expanded thresholds.js with UI, animation, score color constants
- [x] Optimized chart components with ssr: false (4 components in standings page)
- [x] Added PropTypes to ErrorBoundary component
- [x] Created integration tests for response/validation utilities (10 new tests)
- [x] Verified all data-fetching client components use useApiData (30+ components)
- [x] Refactored sync/index.js to use normalize-rounds.js helpers
- [x] Added pre-commit hooks (husky + lint-staged) for auto-formatting
- [x] Created GitHub Actions CI workflow (.github/workflows/ci.yml)
- [x] Added tests for thresholds.js constants (18 tests)
- [x] Added tests for colors.js utilities (9 tests)
- [x] Created types.js with shared @typedef definitions for IDE support
- [x] Enhanced JSDoc in standings.js and users.js with proper return types
- [x] Created API.md with documentation for 32 endpoints
- [x] Created DATABASE.md with schema and Mermaid ERD
- [x] Created COMPONENTS.md with usage examples
- [x] Enhanced .env.example with detailed setup instructions
- [x] Updated README.md with documentation links and improved structure
- [x] Created barrel exports for all component directories (5 index.js files)
- [x] Updated all imports to use barrel exports (100% consistency)
- [x] Created service layer (lib/services/) with 3 service files

### In Progress 🔄

- [ ] _None currently_

### Next Up 📋

- [ ] Add dependency injection for database in sync scripts
- [ ] TypeScript migration (new files only)
- [ ] Security validation for remaining API routes
