"use client";

import Link from "next/link";
import StatCard from "@/components/stats/StatCard";
import MiniBar from "@/components/stats/MiniBar";
import { StatsResult } from "@/lib/types";
import { getOrdinal } from "@/lib/stats";

interface DashboardContentProps {
  stats: StatsResult | null;
  dateRange: { first: string; last: string } | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardContent({
  stats,
  dateRange,
}: DashboardContentProps) {
  if (!stats) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
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
    );
  }

  const {
    totalGames,
    totalKills,
    totalWins,
    totalSessions,
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

  const rangeLabel =
    dateRange
      ? `${formatDate(dateRange.first)} - ${formatDate(dateRange.last)}`
      : "";

  return (
    <div className="space-y-8 pt-6 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Fort Stats
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Session Stats</p>
        <p className="mt-2 text-xs text-muted">
          {totalSessions} sessions / {totalGames} games / {rangeLabel}
        </p>
      </div>

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
