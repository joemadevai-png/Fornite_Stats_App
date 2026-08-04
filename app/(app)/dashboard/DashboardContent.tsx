"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import StatCard from "@/components/stats/StatCard";
import MiniBar from "@/components/stats/MiniBar";
import { StatsResult, MapStat } from "@/lib/types";
import { getOrdinal } from "@/lib/stats";
import { createClient } from "@/lib/supabase/client";

interface DashboardContentProps {
  stats: StatsResult | null;
  dateRange: { first: string; last: string } | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function MapsPanel({
  mapStats,
  onClose,
}: {
  mapStats: MapStat[];
  onClose: () => void;
}) {
  const [maps, setMaps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const gameCount = useCallback(
    (mapName: string) => mapStats.find((m) => m.map === mapName)?.games ?? 0,
    [mapStats]
  );

  const loadMaps = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: loadError } = await supabase
        .from("maps")
        .select("name")
        .order("created_at", { ascending: true });
      if (loadError) {
        setError(loadError.message);
        return;
      }
      setMaps((data ?? []).map((m: { name: string }) => m.name));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMaps();
  }, [loadMaps]);

  async function addMap(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name required.");
      return;
    }
    if (trimmed.length > 40) {
      setError("Too long (40 max).");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("maps").insert({ name: trimmed });
      if (insertError) {
        setError(insertError.code === "23505" ? "That map already exists." : insertError.message);
        return;
      }
      setName("");
      await loadMaps();
    } finally {
      setSaving(false);
    }
  }

  async function deleteMap(mapName: string) {
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("maps").delete().eq("name", mapName);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setConfirmingDelete(null);
    await loadMaps();
  }

  return (
    <div className="w-full rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Maps</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted hover:text-foreground"
        >
          Close
        </button>
      </div>

      {loading && maps.length === 0 ? (
        <p className="py-2 text-xs text-muted">Loading...</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-1">
          {maps.map((m) => {
            const count = gameCount(m);
            const isConfirming = confirmingDelete === m;
            return (
              <li
                key={m}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 py-1.5"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{m}</span>
                {isConfirming ? (
                  <span className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => deleteMap(m)}
                      className="text-xs font-semibold text-red"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(null)}
                      className="text-xs text-muted hover:text-foreground"
                    >
                      Keep
                    </button>
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-[11px] text-muted">
                      {count} game{count === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(m)}
                      aria-label={`Delete ${m}`}
                      className="text-base leading-none text-muted transition-colors hover:text-red"
                    >
                      &times;
                    </button>
                  </span>
                )}
              </li>
            );
          })}
          {maps.length === 0 && !loading && (
            <li className="py-1 text-xs text-muted">No maps yet.</li>
          )}
        </ul>
      )}

      {confirmingDelete && gameCount(confirmingDelete) > 0 && (
        <p className="mb-2 text-[11px] text-muted">
          {gameCount(confirmingDelete)} logged games stay in your stats. The map just
          stops showing up when logging.
        </p>
      )}

      <form onSubmit={addMap} className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="New map name"
          maxLength={40}
          disabled={saving}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted/50 focus:border-blue focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="shrink-0 rounded-lg bg-blue px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "..." : "Add"}
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-red">{error}</p>}
    </div>
  );
}

export default function DashboardContent({
  stats,
  dateRange,
}: DashboardContentProps) {
  const [mapsOpen, setMapsOpen] = useState(false);

  const header = (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Fort Stats
          </h1>
          {stats && (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Session Stats</p>
              <p className="mt-2 text-xs text-muted">
                {stats.totalSessions} sessions / {stats.totalGames} games /{" "}
                {dateRange
                  ? `${formatDate(dateRange.first)} - ${formatDate(dateRange.last)}`
                  : ""}
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMapsOpen((v) => !v)}
          aria-expanded={mapsOpen}
          className="shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-blue hover:text-blue"
        >
          Maps
        </button>
      </div>
      {/* Full width so the panel never overflows a phone viewport */}
      {mapsOpen && (
        <MapsPanel
          mapStats={stats?.mapStats ?? []}
          onClose={() => setMapsOpen(false)}
        />
      )}
    </div>
  );

  if (!stats) {
    return (
      <div className="space-y-8 pt-6 pb-4">
        {header}
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg text-muted-foreground">
            No sessions yet. Log your first session!
          </p>
          <Link
            href="/log"
            className="rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Log Session
          </Link>
        </div>
      </div>
    );
  }

  const {
    totalGames,
    totalKills,
    totalWins,
    avgKillsPerGame,
    avgKillsPerSession,
    avgWinsPerSession,
    avgPlacement,
    winRate,
    top5Rate,
    top3Rate,
    zeroKillGames,
    highKillGames,
    crankGames,
    maxKills,
    maxKillSession,
    avgKillsInWins,
    avgKillsInLosses,
    avgGamesToFirstWin,
    noWinSessions,
    maxWinStreak,
    streakSession,
    secondPlaces,
    secondPlaceRate,
    clutchWins,
    mostCommonPlace,
    mostCommonCount,
    avgGamesPerSession,
    winsOver15,
    wins10to14,
    wins5to9,
    winsUnder5,
    sessionData,
    mapStats,
    taggedMapGames,
  } = stats;

  const winKillBuckets = [
    { label: "15+ kills", count: winsOver15, color: "#FF453A" },
    { label: "10-14 kills", count: wins10to14, color: "#FF9F0A" },
    { label: "5-9 kills", count: wins5to9, color: "#0A84FF" },
    { label: "Under 5 kills", count: winsUnder5, color: "#636366" },
  ];
  const maxBucketCount = Math.max(...winKillBuckets.map((b) => b.count), 1);

  const reversedSessionData = [...sessionData].reverse();
  const avgKillsData = reversedSessionData.map((s) => s.avgKills);
  const winRateData = reversedSessionData.map((s) => s.winRate);
  const maxAvgKills = Math.max(...avgKillsData, 1);
  const maxWinRate = Math.max(...winRateData, 1);

  return (
    <div className="space-y-8 pt-6 pb-4">
      {header}

      {/* Core Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Kills"
          value={totalKills}
          sub={`across ${totalGames} games`}
        />
        <StatCard
          label="Total Wins"
          value={totalWins}
          accent="#059669"
          sub={`${winRate.toFixed(1)}% win rate`}
        />
        <StatCard
          label="Avg Kills / Game"
          value={avgKillsPerGame.toFixed(1)}
        />
        <StatCard
          label="Avg Kills / Session"
          value={avgKillsPerSession.toFixed(1)}
          sub={`${avgGamesPerSession.toFixed(1)} games/session avg`}
        />
        <StatCard
          label="Avg Wins / Session"
          value={avgWinsPerSession.toFixed(1)}
        />
        <StatCard
          label="Avg Placement"
          value={avgPlacement.toFixed(1)}
          sub={`Most common: ${mostCommonPlace}${getOrdinal(mostCommonPlace)} (${mostCommonCount}x)`}
        />
        <StatCard
          label="Top 3 Rate"
          value={`${top3Rate.toFixed(1)}%`}
        />
        <StatCard
          label="Top 5 Rate"
          value={`${top5Rate.toFixed(1)}%`}
        />
        <StatCard
          label="2nd Places"
          value={secondPlaces}
          sub={`${secondPlaceRate.toFixed(1)}% of games`}
        />
        <StatCard
          label="Avg Games to 1st Win"
          value={avgGamesToFirstWin !== null ? avgGamesToFirstWin.toFixed(1) : "N/A"}
          sub={`${noWinSessions} sessions w/ no wins`}
        />
        <StatCard
          label="Best Win Streak"
          value={maxWinStreak > 0 ? `${maxWinStreak} in a row` : "0"}
          sub={streakSession || undefined}
        />
        <StatCard
          label="Highest Kill Game"
          value={maxKills}
          accent="#059669"
          sub={maxKillSession || undefined}
        />
      </div>

      {/* Kill Performance */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">
          Kill Performance
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-semibold" style={{ color: "#34C759" }}>
              {avgKillsInWins.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Avg kills in WINS</p>
          </div>
          <div>
            <p className="text-2xl font-semibold" style={{ color: "#FF453A" }}>
              {avgKillsInLosses.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Avg kills in LOSSES</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {highKillGames}
            </p>
            <p className="text-xs text-muted-foreground">10+ kill games</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {crankGames}
            </p>
            <p className="text-xs text-muted-foreground">15+ kill games</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {zeroKillGames}
            </p>
            <p className="text-xs text-muted-foreground">0 kill games</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {clutchWins}
            </p>
            <p className="text-xs text-muted-foreground">Clutch wins (10+ kills)</p>
          </div>
        </div>
      </div>

      {/* By Map */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            By Map
          </h2>
          <span className="text-xs text-muted">
            {taggedMapGames} of {totalGames} games tagged
          </span>
        </div>

        {mapStats.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tag a map when logging your next session to see a map-by-map breakdown here.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_44px_56px_56px_44px] gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-muted">
              <span>Map</span>
              <span className="text-right">Games</span>
              <span className="text-right">Win %</span>
              <span className="text-right">Top 5 %</span>
              <span className="text-right">Avg K</span>
            </div>

            {mapStats.map((m) => (
              <div
                key={m.map}
                className="grid grid-cols-[1fr_44px_56px_56px_44px] items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
              >
                <span className="truncate text-sm font-medium text-foreground">
                  {m.map}
                </span>
                <span className="text-right text-sm text-foreground">
                  {m.games}
                </span>
                <span className="text-right text-sm font-semibold" style={{ color: "#059669" }}>
                  {m.winRate.toFixed(0)}%
                </span>
                <span className="text-right text-sm text-foreground">
                  {m.top5Rate.toFixed(0)}%
                </span>
                <span className="text-right text-sm text-foreground">
                  {m.avgKills.toFixed(1)}
                </span>
              </div>
            ))}

            <p className="pt-1 text-[11px] text-muted">
              Avg place — {mapStats.map((m) => `${m.map}: ${m.avgPlace.toFixed(1)}`).join(" · ")}
            </p>
          </div>
        )}
      </div>

      {/* How You Win */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">
          How You Win
        </h2>
        <div className="space-y-3">
          {winKillBuckets.map((bucket) => (
            <div key={bucket.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">
                {bucket.label}
              </span>
              <div className="flex-1">
                <div
                  className="h-5 rounded"
                  style={{
                    width: `${Math.max((bucket.count / maxBucketCount) * 100, 2)}%`,
                    backgroundColor: bucket.color,
                  }}
                />
              </div>
              <span className="w-6 text-right text-xs font-medium text-foreground">
                {bucket.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Session Trends */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">
          Session Trends
        </h2>
        <div className="flex flex-wrap gap-8">
          <MiniBar
            data={avgKillsData}
            max={maxAvgKills}
            color="#0A84FF"
            label="Avg Kills per Game"
          />
          <MiniBar
            data={winRateData}
            max={maxWinRate}
            color="#059669"
            height={40}
            label="Win Rate %"
          />
        </div>
      </div>
    </div>
  );
}
