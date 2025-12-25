# Biwenger Stats - Future Improvements Roadmap

## Current Grades (After Round 1 Improvements)

| Category | Grade | Target |
|----------|-------|--------|
| Architecture | A | A+ |
| Code Quality | A | A+ |
| Consistency | A+ | A+ ✓ |
| Professionalism | A | A+ |
| Documentation | A- | A+ |
| Security | A- | A+ |
| Test Coverage | C+ | A+ |
| Performance | A | A+ |

---

## 1. Architecture (A → A+)

- [ ] Add barrel exports for components (`components/index.js`)
- [ ] Create shared type definitions (JSDoc typedefs)
- [ ] Add service layer between API routes and queries
- [ ] Add dependency injection for database in sync scripts

---

## 2. Code Quality (A → A+)

- [ ] Apply response utility to ALL remaining API routes
- [ ] Import and use normalize-rounds.js in sync/index.js
- [ ] Add useApiData hook to remaining components
- [ ] Extract magic numbers to constants file
- [ ] Add PropTypes validation to components

---

## 3. Consistency (A+ ✓)

Already complete! Maintain by:
- Following established patterns for new code
- Documenting patterns in CONTRIBUTING.md

---

## 4. Professionalism (A → A+)

- [ ] Add Prettier configuration
- [ ] Add pre-commit hooks (husky + lint-staged)
- [ ] Add GitHub Actions CI/CD pipeline
- [ ] Start TypeScript migration (new files only)

---

## 5. Documentation (A- → A+)

- [ ] Add JSDoc return types to all query functions
- [ ] Create API documentation (endpoints, params, responses)
- [ ] Add database schema diagram
- [ ] Document each component with usage examples
- [ ] Improve .env.example with detailed comments

---

## 6. Security (A- → A+)

- [ ] Apply validation.js to ALL API routes with parameters
- [ ] Add rate limiting middleware
- [ ] Add CORS configuration for production
- [ ] Add security event logging
- [ ] Add input sanitization for XSS prevention

---

## 7. Test Coverage (C+ → A+) ⚠️ PRIORITY

- [ ] Fix failing sync-players.test.js
- [ ] Add tests for validation.js (3 functions)
- [ ] Add tests for response.js (3 functions)
- [ ] Add tests for normalize-rounds.js (3 functions)
- [ ] Add integration tests for key API routes
- [ ] Add component tests for StreakCard
- [ ] Add test coverage reporting
- [ ] Reach 80%+ coverage

---

## 8. Performance (A → A+)

- [ ] Apply caching to ALL read-only API endpoints
- [ ] Add database indexes for common queries
- [ ] Add React.memo to expensive components
- [ ] Add lazy loading for below-the-fold cards
- [ ] Use next/image for player photos
- [ ] Run bundle analyzer to check dependencies

---

## Quick Wins (Do First)

| Task | Time | Category |
|------|------|----------|
| Fix failing test | 15 min | Tests |
| Apply response.js to remaining routes | 30 min | Quality |
| Add tests for new utilities | 45 min | Tests |
| Add Prettier config | 10 min | Prof. |
| Add database indexes | 20 min | Perf. |

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

### In Progress 🔄
- [ ] _None currently_

### Next Up 📋
- [ ] Fix failing test
- [ ] Apply utilities to remaining routes
- [ ] Add unit tests for new utilities
