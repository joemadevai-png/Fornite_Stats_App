# Fortnite Stats

Next.js 16 + Supabase app Joe and a friend use to track their Fortnite sessions and games. Public repo: https://github.com/joemadevai-png/Fornite_Stats_App

You have standing permission to edit this file. Only add a line if its absence would cause a mistake.

## Where we are

**Phase:** Working and in use. Four screens live behind a bottom nav: Dashboard, Fun Facts, Sessions, Log.

**Last done:** The shared Log draft is the recent focus. `76ce8b6` made the shared draft actually live and stopped it wiping itself; `9e9bca9` let the map dropdown be stepped through from the stepper; `35c786b` fixed mobile date/label overlap and grouped Fun Facts. Migration `007_draft_sync.sql` added a server-authoritative revision counter so clients can order updates and drop stale ones.

**Next up:** Nothing committed in flight. The draft-sync work is the newest and least settled area, so that is where regressions are most likely. See IDEAS.md.

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
- **Bottom nav with exactly 4 items.** Dashboard, Fun Facts, Sessions, Log.
- **Maps are dynamic, not a hardcoded enum.** The list started hardcoded, grew by commits (`33dcfe3` Simpsons, `b7792a3` Adobe) and was finally made data-driven in `006_dynamic_maps.sql`. Add maps through the Maps panel, not in code.
- **The Log draft is shared and real-time via Supabase Realtime**, not local-only (`15a7f4b`). Edits from one person appear for the other.
- **Realtime publication changes must assert, not swallow errors.** Migrations 004 and 006 wrapped `ALTER PUBLICATION` in `EXCEPTION WHEN OTHERS THEN NULL`, which hid whether Realtime was ever enabled. `007` re-asserts and raises if membership still is not there. Never reintroduce the silent-exception pattern.
- **Maps live in a table, not a list** (`c2efd0f`).

## Gotchas

- `supabase/.temp` is gitignored (`e956924`); it holds Supabase CLI local state and the project link.
- The shared draft has a revision counter. When touching `lib/draft/useSharedDraft.ts`, preserve the ordering and stale-drop logic or edits will clobber each other.
- Never edit an existing file in `supabase/migrations/`. Add a new numbered one.
