import { Session, StatsResult, StreakDetail } from "./types";

export function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function computeStats(sessions: Session[]): StatsResult {
  const allGames = sessions.flatMap((s) => s.games);
  const totalGames = allGames.length;
  const totalKills = allGames.reduce((s, g) => s + g.kills, 0);
  const wins = allGames.filter((g) => g.place === 1);
  const totalWins = wins.length;
  const totalSessions = sessions.length;

  const avgKillsPerGame = totalGames > 0 ? totalKills / totalGames : 0;
  const avgKillsPerSession = totalSessions > 0 ? totalKills / totalSessions : 0;
  const avgWinsPerSession = totalSessions > 0 ? totalWins / totalSessions : 0;
  const avgPlacement = totalGames > 0
    ? allGames.reduce((s, g) => s + g.place, 0) / totalGames
    : 0;
  const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

  const top5 = allGames.filter((g) => g.place <= 5).length;
  const top5Rate = totalGames > 0 ? (top5 / totalGames) * 100 : 0;

  const top3 = allGames.filter((g) => g.place <= 3).length;
  const top3Rate = totalGames > 0 ? (top3 / totalGames) * 100 : 0;

  const zeroKillGames = allGames.filter((g) => g.kills === 0).length;
  const highKillGames = allGames.filter((g) => g.kills >= 10).length;
  const crankGames = allGames.filter((g) => g.kills >= 15).length;

  // Highest kill game
  const maxKills = allGames.length > 0 ? Math.max(...allGames.map((g) => g.kills)) : 0;
  const maxKillGame = allGames.find((g) => g.kills === maxKills);
  let maxKillSession = "";
  if (maxKillGame) {
    for (const s of sessions) {
      if (s.games.includes(maxKillGame)) {
        maxKillSession = s.label;
        break;
      }
    }
  }

  // Avg kills in wins vs losses
  const avgKillsInWins = wins.length > 0
    ? wins.reduce((s, g) => s + g.kills, 0) / wins.length
    : 0;
  const losses = allGames.filter((g) => g.place !== 1);
  const avgKillsInLosses = losses.length > 0
    ? losses.reduce((s, g) => s + g.kills, 0) / losses.length
    : 0;

  // Session records
  let bestKillSession = { label: "", kills: 0 };
  let bestWinSession = { label: "", wins: 0 };
  let longestSession = { label: "", games: 0 };
  let worstSession = { label: "", avg: Infinity };

  sessions.forEach((s) => {
    const sk = s.games.reduce((a, g) => a + g.kills, 0);
    const sw = s.games.filter((g) => g.place === 1).length;
    const sa = s.games.reduce((a, g) => a + g.place, 0) / s.games.length;
    if (sk > bestKillSession.kills) bestKillSession = { label: s.label, kills: sk };
    if (sw > bestWinSession.wins) bestWinSession = { label: s.label, wins: sw };
    if (s.games.length > longestSession.games) longestSession = { label: s.label, games: s.games.length };
    if (sa < worstSession.avg && s.games.length >= 3) worstSession = { label: s.label, avg: sa };
  });

  // Games to first win per session
  const gamesToFirstWin: number[] = [];
  sessions.forEach((s) => {
    const idx = s.games.findIndex((g) => g.place === 1);
    if (idx !== -1) gamesToFirstWin.push(idx + 1);
  });
  const avgGamesToFirstWin = gamesToFirstWin.length > 0
    ? gamesToFirstWin.reduce((a, b) => a + b, 0) / gamesToFirstWin.length
    : null;

  const noWinSessions = sessions.filter((s) => !s.games.some((g) => g.place === 1)).length;

  // Win streaks
  let maxWinStreak = 0;
  let streakSession = "";
  const allStreaks: StreakDetail[] = [];

  sessions.forEach((s) => {
    let localStreak = 0;
    s.games.forEach((g) => {
      if (g.place === 1) {
        localStreak++;
      } else {
        if (localStreak >= 2) allStreaks.push({ length: localStreak, session: s.label });
        localStreak = 0;
      }
    });
    if (localStreak >= 2) allStreaks.push({ length: localStreak, session: s.label });
  });

  sessions.forEach((s) => {
    let localStreak = 0;
    s.games.forEach((g) => {
      if (g.place === 1) {
        localStreak++;
        if (localStreak > maxWinStreak) {
          maxWinStreak = localStreak;
          streakSession = s.label;
        }
      } else {
        localStreak = 0;
      }
    });
  });

  const streakCounts: Record<number, number> = {};
  allStreaks.forEach((s) => {
    streakCounts[s.length] = (streakCounts[s.length] || 0) + 1;
  });
  const streakDetails = [...allStreaks].sort((a, b) => b.length - a.length);

  // 2nd place finishes
  const secondPlaces = allGames.filter((g) => g.place === 2).length;
  const secondPlaceRate = totalGames > 0 ? (secondPlaces / totalGames) * 100 : 0;

  // Clutch factor: wins where kills >= 10
  const clutchWins = wins.filter((g) => g.kills >= 10).length;

  // Most common placement
  const placeCounts: Record<number, number> = {};
  allGames.forEach((g) => {
    placeCounts[g.place] = (placeCounts[g.place] || 0) + 1;
  });
  let mostCommonPlace = 0;
  let mostCommonCount = 0;
  Object.entries(placeCounts).forEach(([p, c]) => {
    if (c > mostCommonCount) {
      mostCommonPlace = parseInt(p);
      mostCommonCount = c;
    }
  });

  // Sessions starting with 2nd place
  const startWith2nd = sessions.filter((s) => s.games[0]?.place === 2).length;

  let openWith2ndCount = 0;
  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].games[0]?.place === 2) openWith2ndCount++;
    else break;
  }

  const avgGamesPerSession = totalSessions > 0 ? totalGames / totalSessions : 0;

  // Kill distribution in wins
  const winsOver15 = wins.filter((g) => g.kills >= 15).length;
  const wins10to14 = wins.filter((g) => g.kills >= 10 && g.kills < 15).length;
  const wins5to9 = wins.filter((g) => g.kills >= 5 && g.kills < 10).length;
  const winsUnder5 = wins.filter((g) => g.kills < 5).length;

  // Per-session data for charts
  const sessionData = sessions.map((s) => ({
    label: s.label,
    totalKills: s.games.reduce((a, g) => a + g.kills, 0),
    avgKills: s.games.length > 0 ? s.games.reduce((a, g) => a + g.kills, 0) / s.games.length : 0,
    wins: s.games.filter((g) => g.place === 1).length,
    games: s.games.length,
    avgPlace: s.games.length > 0 ? s.games.reduce((a, g) => a + g.place, 0) / s.games.length : 0,
    winRate: s.games.length > 0 ? (s.games.filter((g) => g.place === 1).length / s.games.length) * 100 : 0,
    top5Rate: s.games.length > 0 ? (s.games.filter((g) => g.place <= 5).length / s.games.length) * 100 : 0,
  }));

  return {
    totalGames, totalKills, totalWins, totalSessions,
    avgKillsPerGame, avgKillsPerSession, avgWinsPerSession,
    avgPlacement, winRate, top5Rate, top3Rate,
    zeroKillGames, highKillGames, crankGames,
    maxKills, maxKillSession,
    avgKillsInWins, avgKillsInLosses,
    bestKillSession, bestWinSession, longestSession, worstSession,
    avgGamesToFirstWin, noWinSessions,
    maxWinStreak, streakSession, streakCounts, streakDetails,
    secondPlaces, secondPlaceRate,
    clutchWins, mostCommonPlace, mostCommonCount,
    startWith2nd, openWith2ndCount,
    avgGamesPerSession,
    winsOver15, wins10to14, wins5to9, winsUnder5,
    sessionData, placeCounts,
  };
}
