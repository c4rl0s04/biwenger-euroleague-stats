# Roadmap: Manager Authentication & Profile Visits

This document outlines the exact, step-by-step technical process for transitioning to manager-specific passwords and adding the "Recent Visitors" social feature.

## Phase 1: Database & Schema Updates

1.  **Modify `users` table**:
    - Add `password_hash` (TEXT, nullable).
    - Add `is_registered` (BOOLEAN, default false).
    - Add `last_login` (TIMESTAMP, nullable).
2.  **Create `profile_visits` table**:
    - `id` (SERIAL PRIMARY KEY).
    - `visitor_id` (TEXT, FK to `users.id`).
    - `target_id` (TEXT, FK to `users.id`).
    - `visited_at` (TIMESTAMP DEFAULT NOW()).
    - Constraint: Avoid logging multiple visits from the same user to the same target within short intervals (e.g., once per hour).
3.  **Run Migrations**: Update the DB using Drizzle Kit.

## Phase 2: Authentication Backend (`src/auth.js`)

1.  **Install Scrypt/BCrypt**: Utility for secure password hashing.
2.  **Define Credentials Provider**:
    - Update provider to accept `managerId` and `password`.
    - Fetch manager from the `users` table where `id = managerId`.
    - Verify the provided password against `password_hash`.
3.  **Implement JWT/Session Callbacks**:
    - Ensure the Biwenger `managerId` and manager `name` are carried into the session object.

## Phase 3: Login User Interface

1.  **Manager Selector**:
    - Convert the current `login/page.js` to show a searchable dropdown/list of Biwenger managers.
    - Filter the list to only show managers with `is_registered = true`.
2.  **Password Field**: Add a password input linked to the selected manager.
3.  **Error Handling**: Clear messaging for "Incorrect Password" or "Manager not registered".

## Phase 4: Integration & Context

1.  **Update `UserContext.js`**:
    - Modify context to watch the `next-auth` session.
    - If a session exists, automatically set `currentUser` to the authenticated manager.
    - Keep `localStorage` logic as a fallback for unauthenticated views, but prioritize the session.
2.  **App Shell Layout**: Replace the manual "Select User" button with a "Logged in as [Manager]" indicator.

## Phase 5: Social Feature (Profile Visits)

1.  **API Route (`/api/profile/visit`)**:
    - A POST endpoint that takes `targetManagerId`.
    - Extracts `visitorId` from the authenticated session.
    - Records the entry in `profile_visits`.
2.  **Trigger logic**: Call this API whenever a manager profile page is loaded and the viewer is NOT the owner of that profile.
3.  **"Who's Peeking" Component**:
    - A card for the manager profile that fetches the last 5 unique visitors from `profile_visits`.
    - Displays visitor names and a relative time (e.g., "Daniel visited 2h ago").

## Phase 6: Onboarding (Management Script)

1.  **Setup Tool**: Create a small, protected script (or an `npm run` command) to:
    - List all managers.
    - Set/Reset a password for a specific manager.
    - Mark them as `is_registered = true`.

---

## Technical Considerations

- **CSRF Protection**: Ensure all POST requests for visits are protected by the Next.js auth session.
- **Performance**: Add an index to `profile_visits(target_id, visited_at)` for fast visitor lookups.
- **Hydration**: Ensure `UserContext` handles the transition from "Checking session" to "Logged in" state without flashing incorrect UI.
