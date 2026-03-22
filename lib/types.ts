export interface Game {
  id?: string;
  session_id?: string;
  game_order: number;
  place: number;
  kills: number;
}

export interface Session {
  id?: string;
  played_at: string; // ISO date string
  label: string;
  created_at?: string;
  archived_at?: string | null;
  games: Game[];
}

export interface SessionData {
  label: string;
  totalKills: number;
  avgKills: number;
  wins: number;
  games: number;
  avgPlace: number;
  winRate: number;
  top5Rate: number;
}

export interface StreakDetail {
  length: number;
  session: string;
}

export interface StatsResult {
  totalGames: number;
  totalKills: number;
  totalWins: number;
  totalSessions: number;
  avgKillsPerGame: number;
  avgKillsPerSession: number;
  avgWinsPerSession: number;
  avgPlacement: number;
  winRate: number;
  top5Rate: number;
  top3Rate: number;
  zeroKillGames: number;
  highKillGames: number;
  crankGames: number;
  maxKills: number;
  maxKillSession: string;
  avgKillsInWins: number;
  avgKillsInLosses: number;
  bestKillSession: { label: string; kills: number };
  bestWinSession: { label: string; wins: number };
  longestSession: { label: string; games: number };
  worstSession: { label: string; avg: number };
  avgGamesToFirstWin: number | null;
  noWinSessions: number;
  maxWinStreak: number;
  streakSession: string;
  streakCounts: Record<number, number>;
  streakDetails: StreakDetail[];
  secondPlaces: number;
  secondPlaceRate: number;
  clutchWins: number;
  mostCommonPlace: number;
  mostCommonCount: number;
  startWith2nd: number;
  openWith2ndCount: number;
  avgGamesPerSession: number;
  winsOver15: number;
  wins10to14: number;
  wins5to9: number;
  winsUnder5: number;
  sessionData: SessionData[];
  placeCounts: Record<number, number>;
}
