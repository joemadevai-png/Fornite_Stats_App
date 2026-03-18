"use client";

import FunFact from "@/components/stats/FunFact";
import { Session, StatsResult } from "@/lib/types";
import { getOrdinal } from "@/lib/stats";

interface FunFactsContentProps {
  stats: StatsResult | null;
  sessions: Session[];
}

export default function FunFactsContent({ stats, sessions }: FunFactsContentProps) {
  if (!stats) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-muted">No sessions yet</p>
        <p className="mt-1 text-sm text-muted">Log some games to see your fun facts.</p>
      </div>
    );
  }

  const {
    totalSessions,
    totalGames,
    totalKills,
    totalWins,
    startWith2nd,
    openWith2ndCount,
    bestWinSession,
    bestKillSession,
    maxKills,
    maxKillSession,
    maxWinStreak,
    streakSession,
    streakCounts,
    streakDetails,
    avgGamesToFirstWin,
    noWinSessions,
    avgKillsInWins,
    avgKillsInLosses,
    clutchWins,
    secondPlaces,
    secondPlaceRate,
    longestSession,
    mostCommonPlace,
    mostCommonCount,
    crankGames,
    zeroKillGames,
    avgKillsPerSession,
    avgGamesPerSession,
    top5Rate,
  } = stats;

  const startWith2ndPercent = totalSessions > 0
    ? ((startWith2nd / totalSessions) * 100).toFixed(1)
    : "0";

  const clutchPercent = totalWins > 0
    ? ((clutchWins / totalWins) * 100).toFixed(1)
    : "0";

  const killDiff = (avgKillsInWins - avgKillsInLosses).toFixed(1);

  // Fact 15: min games across sessions
  const minGames = sessions.length > 0
    ? Math.min(...sessions.map((s) => s.games.length))
    : 0;

  // Fact 16: Day vs Night comparison
  const daySessions = sessions.filter((s) => s.label.toLowerCase().includes("day"));
  const nightSessions = sessions.filter((s) => s.label.toLowerCase().includes("night"));
  const showDayNight = daySessions.length >= 2 && nightSessions.length >= 2;

  let dayNightText = "";
  if (showDayNight) {
    const dayGames = daySessions.flatMap((s) => s.games);
    const nightGames = nightSessions.flatMap((s) => s.games);
    const dayAvgKills = dayGames.length > 0
      ? (dayGames.reduce((a, g) => a + g.kills, 0) / dayGames.length).toFixed(1)
      : "0";
    const nightAvgKills = nightGames.length > 0
      ? (nightGames.reduce((a, g) => a + g.kills, 0) / nightGames.length).toFixed(1)
      : "0";
    const dayWinRate = dayGames.length > 0
      ? ((dayGames.filter((g) => g.place === 1).length / dayGames.length) * 100).toFixed(1)
      : "0";
    const nightWinRate = nightGames.length > 0
      ? ((nightGames.filter((g) => g.place === 1).length / nightGames.length) * 100).toFixed(1)
      : "0";
    dayNightText = `Day sessions (${daySessions.length}): ${dayAvgKills} avg kills, ${dayWinRate}% win rate. Night sessions (${nightSessions.length}): ${nightAvgKills} avg kills, ${nightWinRate}% win rate.`;
  }

  // Fact 5: streak breakdown
  const sortedStreakLengths = Object.entries(streakCounts)
    .map(([len, count]) => ({ length: Number(len), count }))
    .sort((a, b) => b.length - a.length);
  const streakCountsText = sortedStreakLengths
    .map((s) => `${s.count}x ${s.length}-in-a-row`)
    .join(", ");
  const streakDetailsText = streakDetails
    .map((s) => `${s.length}-streak on ${s.session}`)
    .join(", ");

  const facts: { emoji: string; text: string }[] = [];

  // 1 - Silver start
  let silverText = `You opened with 2nd place in ${startWith2nd} out of ${totalSessions} sessions (${startWith2ndPercent}%).`;
  if (openWith2ndCount > 0) {
    silverText += ` Your last ${openWith2ndCount} consecutive sessions all started with a 2nd place finish — the silver start is becoming a ritual.`;
  }
  facts.push({ emoji: "\uD83E\uDD48", text: silverText });

  // 2 - Best win session
  facts.push({
    emoji: "\uD83C\uDFC6",
    text: `Your best session ever was ${bestWinSession.label} with ${bestWinSession.wins} wins. On that day you were basically the final boss.`,
  });

  // 3 - Best kill session
  facts.push({
    emoji: "\uD83D\uDC80",
    text: `Best kill session: ${bestKillSession.label} with ${bestKillSession.kills} total kills. Your highest single game was ${maxKills} kills on ${maxKillSession}.`,
  });

  // 4 - Longest win streak
  facts.push({
    emoji: "\uD83D\uDD25",
    text: `Your longest win streak is ${maxWinStreak} consecutive wins (${streakSession}). When you're locked in, you're LOCKED in.`,
  });

  // 5 - Win streak breakdown
  if (sortedStreakLengths.length > 0) {
    facts.push({
      emoji: "\uD83D\uDD01",
      text: `Win streak breakdown: ${streakCountsText}. ${streakDetailsText}.`,
    });
  }

  // 6 - Avg games to first win
  facts.push({
    emoji: "\uD83D\uDCCA",
    text: `You average ${avgGamesToFirstWin !== null ? avgGamesToFirstWin.toFixed(1) : "N/A"} games to get your first win of the session. ${noWinSessions} sessions ended without a single win.`,
  });

  // 7 - Kills in wins vs losses
  facts.push({
    emoji: "\u2694\uFE0F",
    text: `You average ${avgKillsInWins.toFixed(1)} kills in wins vs ${avgKillsInLosses.toFixed(1)} in losses — a difference of ${killDiff}. Your wins aren't lucky, they're earned through aggression.`,
  });

  // 8 - Clutch wins
  facts.push({
    emoji: "\uD83C\uDFAF",
    text: `${clutchWins} of your ${totalWins} wins came with 10+ kills — that's ${clutchPercent}% "dominant" victories. You don't just win, you dominate.`,
  });

  // 9 - Second places
  facts.push({
    emoji: "\uD83D\uDE05",
    text: `You placed 2nd a total of ${secondPlaces} times (${secondPlaceRate.toFixed(1)}% of all games). That's a LOT of almost-wins. The 2nd place curse is real.`,
  });

  // 10 - Longest session
  facts.push({
    emoji: "\uD83C\uDFAE",
    text: `Your longest session was ${longestSession.label} with ${longestSession.games} games. That's some serious dedication.`,
  });

  // 11 - Most common placement
  facts.push({
    emoji: "\uD83D\uDCC8",
    text: `Your most common placement is ${mostCommonPlace}${getOrdinal(mostCommonPlace)} — you hit that ${mostCommonCount} times across all games.`,
  });

  // 12 - Crank games
  facts.push({
    emoji: "\uD83D\uDCAA",
    text: `You've dropped ${crankGames} games with 15+ kills. Those are lobby-clearing, controller-throwing performances.`,
  });

  // 13 - Zero kill games
  facts.push({
    emoji: "\uD83E\uDD76",
    text: `${zeroKillGames} times you left a game with 0 kills. Even the best players have off drops.`,
  });

  // 14 - Total body count
  facts.push({
    emoji: "\uD83D\uDD79\uFE0F",
    text: `Total body count across all sessions: ${totalKills} eliminations in ${totalGames} games. You average about ${avgKillsPerSession.toFixed(1)} kills per session.`,
  });

  // 15 - Games per session
  facts.push({
    emoji: "\uD83D\uDCC5",
    text: `You play an average of ${avgGamesPerSession.toFixed(1)} games per session. Your shortest was ${minGames} games, your longest was ${longestSession.games}.`,
  });

  // 16 - Day vs Night
  if (showDayNight) {
    facts.push({
      emoji: "\uD83C\uDF05",
      text: dayNightText,
    });
  }

  // 17 - Top 5 rate
  facts.push({
    emoji: "\uD83C\uDFC5",
    text: `Top 5 rate is ${top5Rate.toFixed(1)}%. That means in roughly ${Math.round(top5Rate / 10)} out of every 10 games, you're in the final fight.`,
  });

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Fun Facts</h1>
        <p className="mt-1 text-sm text-muted">
          Deep-dive stats and quirky patterns from your sessions.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {facts.map((fact, i) => (
          <FunFact key={i} emoji={fact.emoji} text={fact.text} />
        ))}
      </div>
    </div>
  );
}
