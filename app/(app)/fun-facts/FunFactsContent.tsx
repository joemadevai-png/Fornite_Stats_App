"use client";

import FunFact from "@/components/stats/FunFact";
import { Session, StatsResult } from "@/lib/types";
import { getOrdinal } from "@/lib/stats";

interface FunFactsContentProps {
  stats: StatsResult | null;
  sessions: Session[];
}

interface Fact {
  emoji: string;
  text: string;
}

interface Section {
  title: string;
  facts: Fact[];
}

// A map needs this many games before its rates mean anything
const MAP_MIN_GAMES = 5;

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
    mapStats,
    taggedMapGames,
    halfSplit,
    lengthSplit,
  } = stats;

  const startWith2ndPercent = totalSessions > 0
    ? ((startWith2nd / totalSessions) * 100).toFixed(1)
    : "0";

  const clutchPercent = totalWins > 0
    ? ((clutchWins / totalWins) * 100).toFixed(1)
    : "0";

  const killDiff = (avgKillsInWins - avgKillsInLosses).toFixed(1);

  const minGames = sessions.length > 0
    ? Math.min(...sessions.map((s) => s.games.length))
    : 0;

  // Day vs Night comparison
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

  // Streak breakdown
  const sortedStreakLengths = Object.entries(streakCounts)
    .map(([len, count]) => ({ length: Number(len), count }))
    .sort((a, b) => b.length - a.length);
  const streakCountsText = sortedStreakLengths
    .map((s) => `${s.count}x ${s.length}-in-a-row`)
    .join(", ");
  const streakDetailsText = streakDetails
    .map((s) => `${s.length}-streak on ${s.session}`)
    .join(", ");

  // Map groupings
  const rankable = mapStats.filter((m) => m.games >= MAP_MIN_GAMES);
  const thin = mapStats.filter((m) => m.games < MAP_MIN_GAMES);
  const byWinRate = [...rankable].sort((a, b) => b.winRate - a.winRate);
  const byAvgPlace = [...rankable].sort((a, b) => a.avgPlace - b.avgPlace);
  const byAvgKills = [...rankable].sort((a, b) => b.avgKills - a.avgKills);
  const byTop5 = [...rankable].sort((a, b) => b.top5Rate - a.top5Rate);
  const byVolume = [...mapStats].sort((a, b) => b.games - a.games);

  // ---------- MAPS ----------
  const mapFacts: Fact[] = [];

  if (byWinRate.length >= 2) {
    const best = byWinRate[0];
    const worst = byWinRate[byWinRate.length - 1];
    const gap = (best.winRate - worst.winRate).toFixed(1);
    mapFacts.push({
      emoji: "🗺️",
      text:
        best.winRate === worst.winRate
          ? `Across ${rankable.length} maps with enough games to judge, your win rate is dead even at ${best.winRate.toFixed(1)}%. No map bias showing up yet.`
          : `${best.map} is your best map: ${best.winRate.toFixed(1)}% win rate over ${best.games} games. ${worst.map} is your worst at ${worst.winRate.toFixed(1)}% over ${worst.games}. That's a ${gap} point gap, so the map you drop into genuinely matters.`,
    });
  } else if (taggedMapGames > 0) {
    mapFacts.push({
      emoji: "🗺️",
      text: `Only ${taggedMapGames} games have a map tagged so far. Tag at least ${MAP_MIN_GAMES} games on two different maps and this turns into a real head-to-head comparison.`,
    });
  }

  if (rankable.length >= 2) {
    mapFacts.push({
      emoji: "📋",
      text: `Full map rundown: ${rankable
        .map(
          (m) =>
            `${m.map} ${m.winRate.toFixed(0)}% win, ${m.avgKills.toFixed(1)} kills, ${m.avgPlace.toFixed(1)} avg place (${m.games} games)`
        )
        .join(" · ")}.`,
    });
  }

  if (byAvgPlace.length >= 2) {
    const bestPlace = byAvgPlace[0];
    const worstPlace = byAvgPlace[byAvgPlace.length - 1];
    const bestKills = byAvgKills[0];
    const sameMap = bestPlace.map === bestKills.map;
    mapFacts.push({
      emoji: "🎯",
      text: sameMap
        ? `You place highest AND frag hardest on ${bestPlace.map}: ${bestPlace.avgPlace.toFixed(1)} avg placement and ${bestKills.avgKills.toFixed(1)} kills a game. Your worst placement map is ${worstPlace.map} at ${worstPlace.avgPlace.toFixed(1)}. If you had a favorite, the numbers back it up.`
        : `Your best placement map is ${bestPlace.map} (${bestPlace.avgPlace.toFixed(1)} avg place), but you get the most kills on ${bestKills.map} (${bestKills.avgKills.toFixed(1)} a game). Surviving and fragging are happening on different maps, which usually means one is a hot drop and one is a slow play.`,
    });
  }

  if (byTop5.length >= 2) {
    const safest = byTop5[0];
    const roughest = byTop5[byTop5.length - 1];
    mapFacts.push({
      emoji: "🛡️",
      text: `You reach the top 5 most often on ${safest.map} (${safest.top5Rate.toFixed(0)}% of games) and least often on ${roughest.map} (${roughest.top5Rate.toFixed(0)}%). ${safest.map} is where you survive; ${roughest.map} is where you get sent back to the lobby early.`,
    });
  }

  if (byVolume.length > 0 && taggedMapGames > 0) {
    const most = byVolume[0];
    const share = ((most.games / taggedMapGames) * 100).toFixed(0);
    const least = byVolume[byVolume.length - 1];
    mapFacts.push({
      emoji: "🔁",
      text:
        byVolume.length >= 2
          ? `${most.map} is your most played map at ${most.games} of ${taggedMapGames} tagged games (${share}%). ${least.map} is your least played at ${least.games}. Familiarity bias is real, so check whether your best map is just the one you've played the most.`
          : `${most.map} accounts for all ${most.games} of your tagged games so far.`,
    });
  }

  if (thin.length > 0) {
    mapFacts.push({
      emoji: "⏳",
      text: `Still gathering data on ${thin
        .map((m) => `${m.map} (${m.games} game${m.games === 1 ? "" : "s"})`)
        .join(", ")}. Once a map clears ${MAP_MIN_GAMES} games it joins the comparisons above.`,
    });
  }

  // ---------- WINS ----------
  const winFacts: Fact[] = [
    {
      emoji: "🏆",
      text: `Your best session ever was ${bestWinSession.label} with ${bestWinSession.wins} wins. On that day you were basically the final boss.`,
    },
    {
      emoji: "🔥",
      text: `Your longest win streak is ${maxWinStreak} consecutive wins (${streakSession}). When you're locked in, you're LOCKED in.`,
    },
    {
      emoji: "📊",
      text: `You average ${avgGamesToFirstWin !== null ? avgGamesToFirstWin.toFixed(1) : "N/A"} games to get your first win of the session. ${noWinSessions} sessions ended without a single win.`,
    },
    {
      emoji: "🎯",
      text: `${clutchWins} of your ${totalWins} wins came with 10+ kills, that's ${clutchPercent}% dominant victories. You don't just win, you dominate.`,
    },
  ];

  if (sortedStreakLengths.length > 0) {
    winFacts.splice(2, 0, {
      emoji: "🔂",
      text: `Win streak breakdown: ${streakCountsText}. ${streakDetailsText}.`,
    });
  }

  // ---------- KILLS ----------
  const killFacts: Fact[] = [
    {
      emoji: "💀",
      text: `Best kill session: ${bestKillSession.label} with ${bestKillSession.kills} total kills. Your highest single game was ${maxKills} kills on ${maxKillSession}.`,
    },
    {
      emoji: "⚔️",
      text: `You average ${avgKillsInWins.toFixed(1)} kills in wins vs ${avgKillsInLosses.toFixed(1)} in losses, a difference of ${killDiff}. Your wins aren't lucky, they're earned through aggression.`,
    },
    {
      emoji: "💪",
      text: `You've dropped ${crankGames} games with 15+ kills. Those are lobby-clearing, controller-throwing performances.`,
    },
    {
      emoji: "🥶",
      text: `${zeroKillGames} times you left a game with 0 kills. Even the best players have off drops.`,
    },
    {
      emoji: "🕹️",
      text: `Total body count across all sessions: ${totalKills} eliminations in ${totalGames} games. You average about ${avgKillsPerSession.toFixed(1)} kills per session.`,
    },
  ];

  // ---------- PLACEMENTS ----------
  const placementFacts: Fact[] = [
    {
      emoji: "😅",
      text: `You placed 2nd a total of ${secondPlaces} times (${secondPlaceRate.toFixed(1)}% of all games). That's a LOT of almost-wins. The 2nd place curse is real.`,
    },
    {
      emoji: "📈",
      text: `Your most common placement is ${mostCommonPlace}${getOrdinal(mostCommonPlace)}, you hit that ${mostCommonCount} times across all games.`,
    },
    {
      emoji: "🏅",
      text: `Top 5 rate is ${top5Rate.toFixed(1)}%. That means in roughly ${Math.round(top5Rate / 10)} out of every 10 games, you're in the final fight.`,
    },
  ];

  // ---------- SESSIONS ----------
  const sessionFacts: Fact[] = [];

  let silverText = `You opened with 2nd place in ${startWith2nd} out of ${totalSessions} sessions (${startWith2ndPercent}%).`;
  if (openWith2ndCount > 0) {
    silverText += ` Your last ${openWith2ndCount} consecutive sessions all started with a 2nd place finish, the silver start is becoming a ritual.`;
  }
  sessionFacts.push({ emoji: "🥈", text: silverText });

  sessionFacts.push({
    emoji: "🎮",
    text: `Your longest session was ${longestSession.label} with ${longestSession.games} games. That's some serious dedication.`,
  });

  sessionFacts.push({
    emoji: "📅",
    text: `You play an average of ${avgGamesPerSession.toFixed(1)} games per session. Your shortest was ${minGames} games, your longest was ${longestSession.games}.`,
  });

  if (halfSplit) {
    const { front, back, sessionsUsed } = halfSplit;
    const killDelta = back.avgKills - front.avgKills;
    const placeDelta = back.avgPlace - front.avgPlace; // lower place is better
    const warmingUp = killDelta > 0.3 && placeDelta < -0.3;
    const fading = killDelta < -0.3 && placeDelta > 0.3;
    let verdict: string;
    if (warmingUp) {
      verdict = "You're a warm-up player. The second half of your sessions is measurably better, so the first few games are basically practice.";
    } else if (fading) {
      verdict = "You fade. The first half of your sessions is your best work, and the back half is where fatigue shows up.";
    } else {
      verdict = "Your two halves are basically identical, so fatigue and warm-up aren't moving the needle much either way.";
    }
    sessionFacts.push({
      emoji: "⏱️",
      text: `Across ${sessionsUsed} sessions long enough to split: first half averages ${front.avgKills.toFixed(1)} kills and ${front.avgPlace.toFixed(1)} placement, second half averages ${back.avgKills.toFixed(1)} kills and ${back.avgPlace.toFixed(1)}. ${verdict}`,
    });
  }

  if (lengthSplit) {
    const { median, long, short } = lengthSplit;
    const killDelta = long.avgKills - short.avgKills;
    const placeDelta = long.avgPlace - short.avgPlace;
    const longBetter = killDelta > 0.3 && placeDelta < -0.3;
    const shortBetter = killDelta < -0.3 && placeDelta > 0.3;
    let verdict: string;
    if (longBetter) {
      verdict = "Longer sessions are your better sessions. Sticking around pays off.";
    } else if (shortBetter) {
      verdict = "Shorter sessions are your sharper sessions. There's a case for logging off while you're ahead.";
    } else {
      verdict = "Session length barely changes your output, so play as long as you're enjoying it.";
    }
    sessionFacts.push({
      emoji: "📉",
      text: `Your median session is ${median} games. Your ${long.sessions} longer sessions average ${long.avgKills.toFixed(1)} kills and ${long.avgPlace.toFixed(1)} placement per game. Your ${short.sessions} shorter ones average ${short.avgKills.toFixed(1)} kills and ${short.avgPlace.toFixed(1)}. ${verdict}`,
    });
  }

  if (showDayNight) {
    sessionFacts.push({ emoji: "🌅", text: dayNightText });
  }

  const sections: Section[] = [
    { title: "Maps", facts: mapFacts },
    { title: "Wins", facts: winFacts },
    { title: "Kills", facts: killFacts },
    { title: "Placements", facts: placementFacts },
    { title: "Sessions", facts: sessionFacts },
  ].filter((s) => s.facts.length > 0);

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Fun Facts</h1>
        <p className="mt-1 text-sm text-muted">
          Deep-dive stats and quirky patterns from your sessions.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.title}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
                {section.title}
              </h2>
              <span className="text-xs text-muted">{section.facts.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {section.facts.map((fact, i) => (
                <FunFact key={i} emoji={fact.emoji} text={fact.text} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
