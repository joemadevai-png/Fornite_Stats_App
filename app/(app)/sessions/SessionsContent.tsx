"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { deleteSession } from "@/lib/queries";
import { Session } from "@/lib/types";

interface SessionsContentProps {
  sessions: Session[];
}

function placeColor(place: number): string {
  if (place === 1) return "text-green";
  if (place <= 5) return "text-blue";
  return "text-muted";
}

export default function SessionsContent({ sessions }: SessionsContentProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (sessions.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg text-muted-foreground">
          No sessions logged yet.
        </p>
        <Link
          href="/log"
          className="rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Log Session
        </Link>
      </div>
    );
  }

  function handleToggle(id: string | undefined) {
    if (!id) return;
    setExpandedId((prev) => (prev === id ? null : id));
  }

  async function handleDelete(sessionId: string) {
    const supabase = createClient();
    await deleteSession(supabase, sessionId);
    setExpandedId(null);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 pt-6 pb-4">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Sessions
      </h1>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {/* Header row */}
        <div
          className="grid items-center px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted border-b border-border"
          style={{ gridTemplateColumns: "100px 52px 56px 56px 56px 1fr" }}
        >
          <span>Session</span>
          <span className="text-right">Games</span>
          <span className="text-right">Wins</span>
          <span className="text-right">Kills</span>
          <span className="text-right">Avg K</span>
          <span className="text-right">Win%</span>
        </div>

        {/* Session rows */}
        {sessions.map((session) => {
          const wins = session.games.filter((g) => g.place === 1).length;
          const totalKills = session.games.reduce((a, g) => a + g.kills, 0);
          const avgKills =
            session.games.length > 0
              ? totalKills / session.games.length
              : 0;
          const winRate =
            session.games.length > 0
              ? (wins / session.games.length) * 100
              : 0;
          const isExpanded = expandedId === session.id;

          return (
            <div key={session.id} className="border-b border-border last:border-b-0">
              {/* Summary row */}
              <button
                type="button"
                onClick={() => handleToggle(session.id)}
                className="grid w-full items-center px-3 py-3 text-sm text-foreground transition-colors hover:bg-border/30 active:bg-border/50"
                style={{ gridTemplateColumns: "100px 52px 56px 56px 56px 1fr" }}
              >
                <span className="truncate text-left font-medium">
                  {session.label}
                </span>
                <span className="text-right tabular-nums">
                  {session.games.length}
                </span>
                <span
                  className={`text-right tabular-nums ${
                    wins > 0 ? "text-green font-semibold" : ""
                  }`}
                >
                  {wins}
                </span>
                <span className="text-right tabular-nums">{totalKills}</span>
                <span className="text-right tabular-nums">
                  {avgKills.toFixed(1)}
                </span>
                <span className="text-right tabular-nums">
                  {winRate.toFixed(0)}%
                </span>
              </button>

              {/* Expanded game details */}
              {isExpanded && (
                <div className="border-t border-border bg-background px-3 py-3">
                  {/* Game detail header */}
                  <div className="grid grid-cols-3 mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                    <span>Game</span>
                    <span className="text-right">Place</span>
                    <span className="text-right">Kills</span>
                  </div>

                  {/* Individual games */}
                  {session.games.map((game) => (
                    <div
                      key={game.id ?? game.game_order}
                      className="grid grid-cols-3 py-1.5 text-sm"
                    >
                      <span className="text-muted-foreground">
                        Game {game.game_order}
                      </span>
                      <span
                        className={`text-right font-medium tabular-nums ${placeColor(
                          game.place
                        )}`}
                      >
                        #{game.place}
                      </span>
                      <span className="text-right tabular-nums text-foreground">
                        {game.kills}
                      </span>
                    </div>
                  ))}

                  {/* Delete button */}
                  {session.id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(session.id!)}
                      disabled={isPending}
                      className="mt-4 rounded-lg border border-red/30 px-4 py-2 text-xs font-medium text-red transition-colors hover:bg-red/10 disabled:opacity-50"
                    >
                      {isPending ? "Deleting..." : "Delete Session"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
