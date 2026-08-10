## Safety Checklist

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run docs:check`
- [ ] `npm run test:run`
- [ ] `SKIP_DB=true npm run build`

## Documentation Safety

- [ ] User-visible behavior, routes, configuration, schema, commands, architecture, and operational
      rules changed by this PR are documented in the canonical `docs/` note.
- [ ] New or moved notes are linked from the appropriate map of content and contain required
      frontmatter.

## API Contract Safety

- [ ] No route URL, method, query parameter, response envelope, status code, or cache header changed.
- [ ] Any intentional API contract change is covered by a failing-before/passing-after test and documented in the PR.

## Database Safety

- [ ] This PR does not drop, truncate, rename, or rewrite production data.
- [ ] If this PR affects schema or migrations, a fresh DB backup has been taken:
  - [ ] `pg_dump --schema-only`
  - [ ] `pg_dump --data-only`
  - [ ] row counts for application tables
  - [ ] current Drizzle migration journal state
- [ ] `npm run db:audit:schema` has been reviewed before applying any migration-affecting change.
