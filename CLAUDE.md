# Fortnite Stats

Next.js 16 + Supabase app Joe and a friend use to track their Fortnite sessions and games. Public repo: https://github.com/joemadevai-png/Fornite_Stats_App

You have standing permission to edit this file. Only add a line if its absence would cause a mistake.

## Where we are

**Phase:** Working and in use. Four screens live behind a bottom nav: Dashboard, Fun Facts, Sessions, Log.

**Last done:** Map management got its own tab. Migration `008_map_management.sql` added `maps.last_used_at` plus `rename_map()` and `merge_maps()` functions, and the Maps tab replaced the Maps panel that used to live on the Dashboard. Before that the shared Log draft was the focus: `76ce8b6` made it actually live and stopped it wiping itself, and `007_draft_sync.sql` added the revision counter.

**Next up:** Nothing committed in flight. Draft sync and map rename/merge are the two newest areas, so that is where regressions are most likely. See IDEAS.md.

## Stack

- Next.js 16.2 (App Router), React, TypeScript
- Supabase: `@supabase/ssr` + `@supabase/supabase-js`, 7 migrations, Realtime for the shared draft
- date-fns for date handling
- No API routes. Data access goes through `lib/queries.ts` and the Supabase clients.

## Structure

```
app/
  (app)/dashboard/   # DashboardContent.tsx
  (app)/fun-facts/   # FunFactsContent.tsx
  (app)/sessions/    # SessionsContent.tsx
  (app)/log/         # page.tsx + SyncIndicator.tsx
  (app)/maps/        # page.tsx + MapsContent.tsx (add / rename / merge / delete)
components/
  BottomNav.tsx      # the 4 nav items
  stats/             # StatCard, MiniBar, FunFact
lib/
  queries.ts         # all Supabase reads/writes
  stats.ts           # derived stats and fun-fact calculations
  types.ts
  draft/             # storage.ts, types.ts, useSharedDraft.ts
  supabase/          # client.ts (browser), server.ts (server)
supabase/migrations/ # 001-007
```

Core tables are `sessions` and `games` (migration 001).

## Commands

```bash
PATH=/usr/local/bin:$PATH npx next dev
npx next build
npx tsc --noEmit
supabase db push
```

## Won decisions

Choices already made. Do not re-suggest the alternative.

- **No auth. The app is fully open.** A passcode gate was built and then deliberately removed in `0c261da`. Do not propose adding login back.
- **Bottom nav has 5 items.** Dashboard, Fun Facts, Sessions, Maps, Log. Log stays bottom-right (Joe asked to keep it there). It was 4 until Joe asked for a Maps tab; the nav uses `flex-1` items and 11px labels to fit five across a 375px iPhone.
- **Maps are dynamic, not a hardcoded enum.** The list started hardcoded, grew by commits (`33dcfe3` Simpsons, `b7792a3` Adobe) and was finally made data-driven in `006_dynamic_maps.sql`. Add maps through the Maps panel, not in code.
- **The Log draft is shared and real-time via Supabase Realtime**, not local-only (`15a7f4b`). Edits from one person appear for the other.
- **Realtime publication changes must assert, not swallow errors.** Migrations 004 and 006 wrapped `ALTER PUBLICATION` in `EXCEPTION WHEN OTHERS THEN NULL`, which hid whether Realtime was ever enabled. `007` re-asserts and raises if membership still is not there. Never reintroduce the silent-exception pattern.
- **Maps live in a table, not a list** (`c2efd0f`).
- **Map management lives on the Maps tab, not the Dashboard.** The Dashboard panel was removed when the tab landed, so there is one place to add, rename, merge and delete.
- **Renaming a map rewrites its history.** Joe chose this over leaving old games on the old name, which would split a map's stats in two.
- **The Log dropdown is ordered most-recently-used first**, and recency only moves when a session is saved so the order cannot reshuffle mid-session.

## Gotchas

- `supabase/.temp` is gitignored (`e956924`); it holds Supabase CLI local state and the project link.
- The shared draft has a revision counter. When touching `lib/draft/useSharedDraft.ts`, preserve the ordering and stale-drop logic or edits will clobber each other.
- Never edit an existing file in `supabase/migrations/`. Add a new numbered one.
- `games.map` stores the map NAME as plain text with no foreign key to `maps`. Never rename a map with a bare `UPDATE maps`; call the `rename_map()` or `merge_maps()` functions from `008`, which change both tables inside one transaction. A bare update orphans every game under the old name.
- This Mac is arm64 but `node_modules` was installed for x64. If a build dies on `Cannot find module '../lightningcss.darwin-arm64.node'` or the swc equivalent, install the arm64 natives: `npm install --no-save lightningcss-darwin-arm64@<ver> @next/swc-darwin-arm64@<ver>`.
