import { DraftDoc, normalizeGames } from "./types";

const CLIENT_ID_KEY = "fort-stats-client-id";
const MIRROR_KEY = "fort-stats-draft-mirror-v1";
/** Pre-shared-draft key. Read once as a last resort, then dropped. */
const LEGACY_KEY = "fort-stats-draft";

export interface Mirror {
  doc: DraftDoc;
  /** Server revision the local edits were made on top of. */
  baseRevision: number;
  /** True while the local edits have not been acknowledged by the server. */
  dirty: boolean;
  ts: number;
  clientId: string;
}

/**
 * Stable per-device id, persisted so it survives navigation and reloads.
 * A per-mount id would make our own earlier writes echo back looking foreign,
 * and would break "edited on the other phone".
 */
export function getClientId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(CLIENT_ID_KEY, id);
    return id;
  } catch {
    return `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function readMirror(): Mirror | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MIRROR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Mirror>;
    if (!parsed || typeof parsed !== "object" || !parsed.doc) return null;
    return {
      doc: {
        date: typeof parsed.doc.date === "string" ? parsed.doc.date : "",
        label: typeof parsed.doc.label === "string" ? parsed.doc.label : "",
        games: normalizeGames(parsed.doc.games),
      },
      baseRevision: typeof parsed.baseRevision === "number" ? parsed.baseRevision : 0,
      dirty: parsed.dirty === true,
      ts: typeof parsed.ts === "number" ? parsed.ts : 0,
      clientId: typeof parsed.clientId === "string" ? parsed.clientId : "",
    };
  } catch {
    return null;
  }
}

/** Written synchronously on every edit so a hard teardown cannot lose work. */
export function writeMirror(m: Mirror): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MIRROR_KEY, JSON.stringify(m));
  } catch {
    // quota or private mode; the server copy is still the source of truth
  }
}

export function clearMirror(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(MIRROR_KEY);
  } catch {
    // ignore
  }
}

/**
 * One-release fallback for drafts saved before the shared-draft work.
 * Only consulted when both the server row and the mirror are empty.
 */
export function takeLegacyDraft(): DraftDoc | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(LEGACY_KEY);
    const parsed = JSON.parse(raw);
    const games = normalizeGames(parsed?.games);
    const worthKeeping =
      games.some((g) => g.place || g.kills || g.map) ||
      (typeof parsed?.label === "string" && parsed.label.length > 0);
    if (!worthKeeping) return null;
    return {
      date: typeof parsed?.date === "string" ? parsed.date : "",
      label: typeof parsed?.label === "string" ? parsed.label : "",
      games,
    };
  } catch {
    return null;
  }
}
