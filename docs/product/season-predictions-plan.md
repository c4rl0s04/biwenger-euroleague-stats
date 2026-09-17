---
title: Pronósticos de temporada — product and architecture design
description: Recorded season-prediction decisions, multi-select storage, services and deferred UI; no implementation authorized.
audience:
  - user
  - contributor
  - maintainer
  - agent
status: draft
---

# Season predictions — design plan

## 1. Purpose, authority and recorded decisions

**Pronósticos de temporada** is a new season-specific page for recording expectations and
revisiting other managers' picks. It is a social time capsule, not a scored competition.
Technical owner proposed: `src/features/season-predictions`.

The user approved the following product direction on 2026-09-13, superseding the original draft:

- Keep the 12 questions; include players, teams and managers.
- Support multiple player picks. Five disappointment picks were suggested; exact limits per
  player question are still to be confirmed, not silently fixed at five everywhere.
- Require the first 11 questions; only the below-expectations manager question is optional.
- No additional written/bold-prediction question.
- Close before the first game. Submitted predictions become immutable.
- Reveal others' submissions after the first game. Confirm whether this means after tip-off
  or after its conclusion before selecting an exact reveal trigger.
- **No scoring or judging at all:** no accuracy counts, points, ranking, winners or verdicts.
- No scoring-period definition is needed. Displayed contextual facts must still belong to
  the chosen season and identify their source/phase.
- Every manager is allowed to participate; no manually selected invitations.
- Only the owner, identified as **All Stars**, may configure the feature.
- UI implementation stays on hold. Build directly with the target UI layers when ready.

This update authorizes documentation only, not backend/UI code, schema application, permission
assignment, deployment, provider operations or changes in the migration worktree.
Reconcile current migrated contracts before a separately authorized implementation.

### Repository evidence and distinctions

Read-only inspection: main `354f66e1585cb59a15efe96f094defdba6ad1e65` on 2026-09-13.
This is source evidence, not a production-data or live-session audit.

- Existing /predictions and porras cover synchronized per-round Biwenger pools.
  /playoffs and playoff_predictions cover bracket/stage picks. Neither is replaced.
- users, players and teams are global identities, not one identity per season.
  users.id and seasons.id are text; player/team IDs are integers.
- player_seasons and user_seasons hold seasonal state with unique season/entity pairs.
  There is no inspected team_seasons table; season-specific official mappings, standings
  and games provide participation context.
- Legacy player statistics also exist globally; do not use latest/global fields to reconstruct
  another season's history when seasonal records are needed.
- Follow [application layers](../architecture/application-layers.md), [UI layering](../architecture/ui-component-layers.md),
  [design context](design-system.md), [data and sync](../architecture/data-and-sync.md) and
  [database safety](../operations/database-safety.md).

## 2. Experience

1. Select season/campaign and read deadline, visibility and selection-count rules.
2. Complete players, teams and managers. Incomplete drafts can be saved privately.
3. Submit the complete selection set; a server revision/timestamp confirms persistence.
4. Replace the submission before close if desired. Opening the edit form does not unsave it.
5. Close before the first game; no new submissions or edits afterward.
6. Reveal submitted entries after the agreed first-game event; browse by manager or question.
7. Revisit picks at season end and in archives, with optional factual context but no judgement.

Before reveal, only the author sees their entry. Unsubmitted drafts are never published.
“Everyone” means authorized league users, not unauthenticated internet access.
No votes, confidence sliders, notifications, comments, written bonus question or leaderboard in v1.

## 3. Question catalogue and selection counts

Keep all 12 questions. Team/manager picks remain single-select. Player questions support
multi-select where configured; final per-question limits and plural wording need confirmation.

| Key                        | Spanish question                                        | Selection                                              | Required |
| -------------------------- | ------------------------------------------------------- | ------------------------------------------------------ | -------- |
| player_fantasy_leader      | ¿Qué jugador terminará con más puntos fantasy?          | Confirm single winner versus multiple top-player picks | Yes      |
| player_revelation          | ¿Qué jugadores serán la revelación de la temporada?     | Multiple season players                                | Yes      |
| player_disappointment      | ¿Qué jugadores rendirán por debajo de tus expectativas? | Multiple season players; five suggested                | Yes      |
| player_personal_bet        | ¿Por qué jugadores apostarías para construir tu equipo? | Multiple season players                                | Yes      |
| team_champion              | ¿Qué equipo ganará la Euroliga?                         | One season team                                        | Yes      |
| team_regular_leader        | ¿Qué equipo acabará primero en la fase regular?         | One season team                                        | Yes      |
| team_revelation            | ¿Qué equipo superará las expectativas?                  | One season team                                        | Yes      |
| team_disappointment        | ¿Qué equipo se quedará por debajo de las expectativas?  | One season team                                        | Yes      |
| manager_champion           | ¿Qué manager ganará nuestra liga fantasy?               | One season manager                                     | Yes      |
| manager_round_record       | ¿Qué manager hará la mejor jornada de la temporada?     | One season manager                                     | Yes      |
| manager_surprise           | ¿Qué manager dará la sorpresa positiva?                 | One season manager                                     | Yes      |
| manager_below_expectations | ¿Qué manager acabará por debajo de tus expectativas?    | Zero or one season manager                             | No       |

Store minSelections and maxSelections per question. Suggested multi-select rule: one-to-five
distinct players, not exactly five required. This limit remains a proposal. Required means
meeting the approved minimum, not filling every optional slot. Picks are unordered, not a ranking.
Reject duplicate IDs; permit an entity to appear in different questions. Manager self-picks are allowed.
Fantasy ownership does not restrict player selection.

No correct/incorrect classification exists for any question. Actual sports facts may be shown
alongside picks, but the app does not determine whether a revelation or disappointment “won”.
No written question is added. Optional explanations from the first draft are not a requirement;
the proposed v1 form/schema is selection-only to avoid adding unrequested text inputs.

Freeze options and question definitions when opening. Use only entities eligible for that season.
Departures/transfers/name changes do not invalidate locked picks. Adding candidates after opening
requires an explicit fair-change policy, not automatic changes from later synchronization.

## 4. Lifecycle, deadlines and transactional writes

Effective states: draft -> open -> locked -> revealed -> archived. There is no graded/reviewed state.
Derive open/closed state from server time and published configuration, not a cron execution.
UTC timestamptz values are displayed with a local timezone label.

Close at the configured preseason cutoff no later than first tip-off. Record the first-game
identity/source. Exact cutoff margin and reveal event remain to be confirmed. Never automatically
reopen if the game is postponed. If the reveal event is unknown, remain sealed rather than guess.
No arbitrary mid-season campaign is part of the approved first release.

- saveDraft: only for owned drafts before close; incomplete selections allowed.
- submitEntry: validate all counts and required questions; atomically replace the complete set.
- A submitted form stays submitted until a replacement succeeds. saveDraft cannot demote it.
- expectedRevision protects against stale tabs/devices; return a conflict, not last-write-wins.
- An operation ID plus payload hash acknowledges an immediate identical retry. Changed payload
  under that ID is rejected; older operations conflict rather than reapply past revisions.
- Lock/serialize the entry and check ownership, eligibility, revision, approved rules and deadline
  in the same transaction. Sample database wall-clock after acquiring the lock; transaction-start
  now() must not permit a write after waiting across the cutoff. Test the update as acceptance point.
- A post-close retry may acknowledge a pre-close committed revision, but cannot change answers.
- No admin setting can silently edit locked picks or reopen them after the first game.
- Do not log answer payloads or secrets.

This is confidentiality from other app users, not cryptographic sealing from database administrators.
V1 does not promise offline submissions or background replay.

## 5. Proposed storage and season-linked IDs

Use additive feature tables, not profile columns or porras/playoff storage.
No SQL/schema migration is implemented by this plan. The original result-revision and winner
tables are removed because the user explicitly rejected scoring and judging.

| Table                     | Main fields                                                                                                                                                       | Purpose / constraints                                                                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| season_forecast_campaigns | UUID id; season_id FK; slug/title; template_version; opens_at/closes_at/reveal_at; first-game reference/reveal rule; published_at; archived_at; question_set_hash | UNIQUE(season_id, slug). Season is immutable after opening. Typed configuration, no executable rule strings.                                               |
| season_forecast_questions | UUID id; campaign_id; key/ordinal; category; target_kind; label/help_text; min_selections/max_selections                                                          | Unique campaign/key and campaign/ordinal. Valid min/max; optional manager question has minimum zero. No evaluation rules or weights.                       |
| season_forecast_options   | UUID id; campaign_id; season_id; target_kind; nullable player_id/team_id/manager_id; label/subtitle/image snapshots                                               | Exactly one target FK matching its kind. Unique campaign/entity; historical labels are not identity.                                                       |
| season_forecast_entries   | UUID id; campaign_id; user_id FK; draft/submitted; revision; submitted_at/updated_at; author_label_snapshot; last_operation_id/hash                               | UNIQUE(campaign_id, user_id). Author from trusted session. No written-prediction field.                                                                    |
| season_forecast_answers   | entry_id; campaign_id; question_id; target_kind; option_id                                                                                                        | PRIMARY KEY(entry_id, question_id, option_id). Multiple distinct choices; composite FKs keep entry/question/option in the same campaign and kinds aligned. |

### Linkage, not name-based matching

An answer points to an option; the option points to players.id, teams.id or users.id.
The campaign points to seasons.id. The author user_id and selected manager_id are separate.
For example, player 123 selected in the 2026-27 campaign is joined to that player's 2026-27
facts, never whichever season is currently configured.

Make options.season_id agree with the campaign using a composite FK. Add composite FKs to
player_seasons(season_id, player_id) and user_seasons(season_id, user_id) for player/manager
candidate eligibility, alongside stable identity relationships. For teams, validate authoritative
season participant/mapping data when publishing the frozen candidate list and retain a teams FK.
An existing global team row alone is not proof of participation that season.

Add necessary composite unique keys and normal enum/length/revision/date checks. Min/max selection
counts require transactional multi-row validation, not merely a row CHECK. Serialize each entry's
replacement, and test races. Consider deferred DB count enforcement if other writers are introduced.

Indexes: season/campaign lookup; entries campaign/status/owner; answers campaign/question/option.
Do not cascade entity deletion into historical picks. Resolve account anonymization/deletion policy
before schema implementation; snapshots preserve display labels, not credentials or entire account rows.

Assumption: one configured league per season. A real multi-league deployment requires an explicit
trusted league scope before implementation, not a client-selected identifier.

Existing tables already store actual sports/fantasy results. Read those season-specific models
for retrospective context; do not duplicate all points or store prediction verdicts here.
A frozen retrospective fact snapshot, if later wanted, needs its own source/time/version design.
It is not required to persist and display the selected picks.

## 6. Feature boundary, services and transport

Proposed feature structure (not yet created):

```text
src/features/season-predictions/
  public.ts                 client-safe models and eventual components
  server.ts                 server-only service contracts
  models/                   questionnaire, selections, entries, retrospective display
  validation/               route inputs and bounded draft/submission/config schemas
  lib/                      pure lifecycle and completeness/count rules
  server/
    queries/                feature-owned reads with explicit records
    repositories/           transactional entry/configuration writes
    mappers/                allowlisted records -> serializable models
    services/               questionnaire, entries, league display, administration
  components/               deferred UI with target layering
  hooks/                    browser form coordination, never database ownership
```

| Proposed service                  | Inputs                                                                     | Responsibility                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| getQuestionnaire                  | trusted actor, seasonId, campaignSlug                                      | Frozen options/questions, limits, own entry, lifecycle, deadline and permissions.                   |
| saveDraft                         | actor, campaignId, expectedRevision, operationId, answers                  | Save incomplete owned draft before close within approved limits.                                    |
| submitEntry                       | Same envelope                                                              | Complete transactional submission/replacement; return saved revision/time.                          |
| getLeaguePredictions              | actor, campaignId, manager/question view, optional filters, bounded cursor | Sealed state or revealed submissions; no others' drafts.                                            |
| getSeasonRetrospective            | actor, campaignId, optional managerId, bounded cursor                      | Original picks and optional labelled same-season facts; no judgement/ranking.                       |
| prepareCampaign / publishCampaign | trusted owner, versioned definition                                        | Validate dates, eligibility and counts; freeze published questionnaire.                             |
| updateCampaignConfiguration       | trusted owner, expected config revision, allowed fields                    | Future reviewed admin command with lifecycle checks and audit; no arbitrary environment/SQL editor. |

Answer input: { questionId, optionIds: string[] }. No author ID, score or role supplied by the browser.
Empty arrays are allowed for drafts/optional questions. Mappers group relational rows into typed
arrays. Dates become ISO strings; no raw DB records, provider payloads or Record<string, any> escape.

Players/Teams/Managers own season eligibility and entity facts; consume deliberate server contracts.
Any retrospective facts come from their true owner (including Rounds/Standings where needed),
not new duplicate calculations. No dependency from existing Predictions/Playoffs to this feature.
Add narrow owning contracts only where missing, after checking dependency cycles.

Proposed new page: /season-predictions, with season/campaign/view and optional manager query parameters.
Views: mine, league, review. Existing URLs are unchanged; navigation placement is deferred.
Server page -> existing guard -> service -> screen. Browser submit -> thin Server Action ->
trusted session actor -> validation -> command service -> repository. Do not add internal REST
solely for Server Component reads. Check permissions on direct actions, not only page navigation.

Expected errors: UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, CLOSED,
REVISION_CONFLICT, OPERATION_CONFLICT. Unexpected failures are generic/redacted.
Unauthorized responses must not disclose whether a private entry exists.

## 7. Privacy, caching and PWA behavior

- All page/action/read models are authenticated and league-scoped. Default to dynamic, private,
  no-store responses and no persistent server cache, including explicitly requested manager IDs.
- If a future cache is justified, document user/season/campaign/revision/visibility inputs. Never
  cache the mixed questionnaire/own-entry response publicly or rely only on the protected page URL.
- Before reveal, filter other users' entries at the service/query boundary, not in CSS or client code.
  Do not return hidden answers in serialized props, prefetches, metadata, exports or aggregate pick counts.
- Validate bounded payload size, unique question IDs, allowed options, revision and per-question min/max counts.
  Do not send private selections to AI or third-party analytics.
- No direct browser database access. Review grants/RLS for the new tables; do not modify unrelated
  policies. A privileged server connection still must enforce every ownership and membership rule.
- PWA service-worker policy must exclude authenticated prediction data and mutation requests from
  offline caching. Inspect actual worker behavior before release; HTTP no-store alone is not proof.
- V1 does not promise offline submission or background replay. Show unsaved/offline state and retry
  explicitly; do not persist private drafts in shared browser storage by default.
- On logout/session expiry, clear in-memory form state and do not show a prior user's draft.
- Logs may contain operation IDs and generic outcomes, never tokens, credentials or full answers.

## 8. Future UI design — use the new layers from day one

No UI implementation in this task. The plan follows the agreed composition now, so later work
does not create another legacy screen to migrate. Do not start the shared UI migration from this task.

```text
SeasonPredictionsPage                framework inputs, guard, service
└── SeasonPredictionsScreen          desktop/phone arrangement and active view
    ├── CampaignHeader               season, status, deadline, rules
    ├── PredictionFormSection        client-side form coordination
    │   ├── PredictionCategory       players / teams / managers
    │   │   └── PredictionQuestion   label, selection count, validation
    │   │       └── EntitySelector   single/multi-select with approved limits
    │   └── SubmissionPanel          completion, saved state, draft/submit actions
    ├── LeaguePredictionsSection     sealed notice or manager/question comparison
    └── SeasonRetrospectiveSection
        └── PredictionReviewCard    original selections and optional factual context
```

These are meaningful responsibilities, not mandatory empty wrapper files. Each substantial component
has its own feature-owned file. Generic button/input/searchable-select/card primitives stay shared;
prediction rules, copy and review cards stay in this feature. Use domain selectors through acyclic
public contracts only if actually available; prepared generic option models are an alternative.
No speculative universal questionnaire engine or universal statistics card is required.

Desktop: three clearly headed categories with compact question cards, visible progress and save panel;
league comparison can use a table. Phone: one readable column with category navigation, full labels,
searchable selection sheet and save controls above PWA safe areas. Do not squeeze a desktop table onto
the phone; comparison cards must expose the same information. Do not require an arbitrary new route
per category unless the established shell conventions justify it.

Use existing black/slate surfaces, orange accents, semantic tokens and current typography. Avoid
inventing a second palette, font stack, animation library or card system. Status is communicated by
text/icon as well as color. Long names and selected-player chips wrap; selections support keyboard search,
Escape, focus return, visible labels and touch interaction. Confirmation/errors use accessible live
regions without stealing focus unexpectedly.

Explicit states: loading; no campaign; not yet open; editing draft; submitted and editable; saving;
validation failure; stale revision; session expired; offline/unsaved; closed without submission;
sealed; revealed; no participants; retrospective; archived;
missing/departed entity with historical label; unavailable data and unexpected error.

## 9. Implementation gates and verification

1. Confirm the narrow outstanding choices below; do not reopen rejected scoring/text features.
2. Reconcile latest migrated contracts and UI readiness; implementation needs separate authorization
   and its own clean worktree, not changes in the concurrent migration workspace.
3. Implement backend models, additive reviewed schema, services and synthetic transactional tests.
4. Review season relationships, multi-pick immutability, deadline races and private-answer isolation.
5. Implement UI later against the target layers and approved contracts.
6. Run full acceptance and obtain separate schema/deployment approval.

Required coverage:

- FK/season/campaign/kind correctness; duplicate picks; min/max counts; required/optional questions;
  complete atomic replacement, rollback, concurrent first creation and stale revisions.
- Before/at/after close; lock waiting across deadline; repeat/conflicting operations; UTC/timezone
  display; first-game reveal and rescheduling without automatic reopening.
- Anonymous/owner/other-manager/historical-only-manager/admin access; direct action tampering;
  same-URL cross-user caching, prefetch/props leakage, logout and service-worker isolation.
- Preserved historical selections after renames/departures; correctly scoped retrospective facts.
- No scoring, accuracy counters, subjective verdicts or winner/leaderboard services introduced.
- Serializable allowlisted models, public/server graph, thin adapters and no duplicate upstream SQL.
- Once UI is authorized: empty/populated/long-name states, multi-select interaction, optional answers,
  keyboard/focus, save/conflict recovery, responsive parity, safe areas and browser comparisons.
- Typecheck, focused/full tests, architecture, lint, build, documentation/formatting, schema metadata,
  Drizzle consistency and diff checks. DB writes use disposable fixtures only. Existing Predictions
  and Playoffs must retain their behavior.

Complete means the agreed questionnaire, season-linked storage, immutable/revealed lifecycle,
privacy, retrospective display, UI and release evidence are verified. No scoring is a requirement,
not an outstanding future task. Backend completion alone is not page completion.

## 10. Remaining narrow choices

- Exact player selection limits: one-to-five or exactly five? Which player questions permit multiple
  picks? Suggested: one leader pick, one-to-five in the other three; not approved yet.
- Reveal after the first game starts or after it finishes? Select its competition/reference.
  Closing before first tip-off remains mandatory either way.
- Does every manager include previous-season-only accounts submitting a new-season entry, or all
  participants in the campaign's season? Login, ability to view, candidate eligibility and submission
  eligibility are separate policies.

UI stays on hold. The owner is All Stars; resolve the stable ID securely before implementing
permissions. No new written question, scoring decision or judging method needs approval.

## 11. Related administration proposal — not implementation approval

The user asked about a future owner-only settings UI to avoid coding routine configuration.
Recommended initial settings: campaign season, open/close/reveal configuration and publication;
per-question limits only before opening. Store typed, validated settings with revision checks and
an audit of actor/time/old/new values, not arbitrary editable environment variables or executable rules.

Bind configuration permission to All Stars' verified stable account ID through a reviewed
server-side capability mechanism. Never compare the mutable display name, trust localStorage,
selected manager state or a client-supplied role. No existing admin grant has been established
by this inspection. Initial ownership assignment is a separately authorized bootstrap; other
users cannot self-promote. Every administrative command rechecks permission.

Recommended lifecycle safety: freely edit draft configuration; freeze season/questions/options
at publication. Deadline changes after opening require an explicit fair-change policy and visible
audit, and must never reopen editing after the first game or rewrite locked picks.
An administration page must not bypass the agreed immutability rules.

Separate three kinds of season configuration:

1. **Operational season:** sync/ingestion/write targets and provider configuration; not a casual UI toggle.
2. **Default display season:** app-wide initial read choice, potentially an owner-managed product setting.
3. **Viewer-selected season:** a per-view historical filter; never changes sync targets.

A dropdown alone is insufficient: propagate selected season through services, query parameters,
cache keys, links and displayed headers, then test isolation. Do not make an app setting claim to
switch all features while many underlying queries still use the configured operational season.

No Vercel/environment editor, secret editor, SQL console or migration runner belongs in routine
product settings. General administration and global season browsing are separate future scopes.
This document records the recommendation, not authorization to build them.

## 12. Related account/season findings — read-only evidence

Inspected main 354f66e1, not production records:

- src/auth.js authorizes against global users by name/password, without user_seasons membership.
  A retained historical account with valid credentials is not rejected just for lacking current
  participation. Other failures, such as database/credential-service failure, can still prevent login.
- src/auth.config.js checks logged-in state for protected pages, not season participation.
- src/lib/db/season-context.ts takes an explicit requested season where supplied, otherwise
  CONFIG.SEASON.ID. src/lib/config.js derives this operational default from environment configuration.
- The manager statistics service has no viewer-selected season argument. Its query preserves global
  identity through a LEFT JOIN, then reads the configured season's rounds. Missing rows yield zero
  totals/rounds; the mapper uses position zero when there is no standing.
- Desktop MySeasonCard requests the signed-in manager ID and displays those fields. A historical-only
  manager can therefore see zero points and a misleading position zero rather than a clear
  non-participation state. Squad reads are also configured-season filtered. No automatic switch
  to the manager's last participating season was found in this traced path.

This is representative login/dashboard/manager source evidence, not an exhaustive screen audit or
live-user replay. Recommended future behavior: retained accounts can sign in; a selected season
without participation shows “No participaste en esta temporada”, with intentional historical
browsing. Changing access policy, implementing a season selector or granting admin rights is
not part of this documentation update.
