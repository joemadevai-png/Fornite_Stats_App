import { MapName } from "@/lib/types";

export interface GameDraft {
  place: string;
  kills: string;
  map: MapName | null;
}

export interface DraftDoc {
  date: string;
  label: string;
  games: GameDraft[];
}

/** Shape of the session_drafts row as the client reads it. */
export interface DraftRow {
  played_at: string | null;
  label: string | null;
  games: unknown;
  updated_by: string | null;
  revision: number;
  updated_at: string;
}

export type SyncStatus =
  | { kind: "loading" }
  | { kind: "saving" }
  | {
      kind: "saved";
      lastServerAt: number;
      /** Who made the change currently on screen. */
      lastEditor: "me" | "other" | null;
      /** When that change landed locally, for "edited 4s ago". */
      lastEditAt: number;
    }
  | { kind: "stale" }
  | { kind: "offline" }
  | { kind: "error"; message: string };

export function emptyGame(): GameDraft {
  return { place: "", kills: "", map: null };
}

export function formatLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function freshDoc(): DraftDoc {
  return { date: todayISO(), label: formatLabel(new Date()), games: [emptyGame()] };
}

export function normalizeGames(raw: unknown): GameDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((g): g is Record<string, unknown> => typeof g === "object" && g !== null)
    .map((g) => ({
      place: typeof g.place === "string" ? g.place : "",
      kills: typeof g.kills === "string" ? g.kills : "",
      map: (g.map as MapName | null | undefined) ?? null,
    }));
}

/** A doc is "empty" when there is nothing worth preserving in it. */
export function docIsEmpty(doc: DraftDoc): boolean {
  return doc.games.every((g) => !g.place && !g.kills && !g.map);
}

export function rowToDoc(row: DraftRow): DraftDoc {
  const games = normalizeGames(row.games);
  return {
    date: row.played_at || todayISO(),
    label: row.label && row.label.length > 0 ? row.label : formatLabel(new Date()),
    games: games.length > 0 ? games : [emptyGame()],
  };
}
