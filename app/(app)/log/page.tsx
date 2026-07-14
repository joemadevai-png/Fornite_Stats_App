"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { createSession } from "@/lib/queries";
import { MapName } from "@/lib/types";

const LEGACY_DRAFT_KEY = "fort-stats-draft";

function formatLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

interface GameDraft {
  place: string;
  kills: string;
  map: MapName | null;
}

function emptyGame(): GameDraft {
  return { place: "", kills: "", map: null };
}

function nextMap(cur: MapName | null): MapName | null {
  if (cur === null) return "Venture";
  if (cur === "Venture") return "Elite Stronghold";
  if (cur === "Elite Stronghold") return "Slurp Rush";
  if (cur === "Slurp Rush") return "Adobe";
  return null;
}

function normalizeGames(raw: unknown): GameDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((g): g is Record<string, unknown> => typeof g === "object" && g !== null)
    .map((g) => ({
      place: typeof g.place === "string" ? g.place : "",
      kills: typeof g.kills === "string" ? g.kills : "",
      map: (g.map as MapName | null | undefined) ?? null,
    }));
}

function loadLegacyDraft(): { date: string; label: string; games: GameDraft[] } | null {
  try {
    const raw = sessionStorage.getItem(LEGACY_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const games = normalizeGames(parsed?.games);
    const nonEmpty =
      (parsed?.date && parsed.date.length > 0) ||
      (parsed?.label && parsed.label.length > 0) ||
      games.some((g) => g.place || g.kills || g.map);
    if (!nonEmpty) return null;
    return {
      date: typeof parsed?.date === "string" ? parsed.date : "",
      label: typeof parsed?.label === "string" ? parsed.label : "",
      games,
    };
  } catch {
    return null;
  }
}

function clearLegacyDraft() {
  try {
    sessionStorage.removeItem(LEGACY_DRAFT_KEY);
  } catch {
    // ignore
  }
}

export default function LogSessionPage() {
  const router = useRouter();

  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [games, setGames] = useState<GameDraft[]>([emptyGame()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [live, setLive] = useState(false);

  const clientIdRef = useRef<string>("");
  const skipNextPersistRef = useRef(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  // Hydrate from Supabase (with legacy sessionStorage fallback) and subscribe to Realtime
  useEffect(() => {
    if (typeof window === "undefined") return;
    clientIdRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const supabase = createClient();
    supabaseRef.current = supabase;

    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("session_drafts")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (cancelled) return;

      const dbGames = normalizeGames(data?.games);
      const dbHasContent =
        !!(data?.played_at || data?.label || dbGames.some((g) => g.place || g.kills || g.map));

      if (dbHasContent && data) {
        skipNextPersistRef.current = true;
        setDate(data.played_at || todayISO());
        setLabel(
          data.label && data.label.length > 0
            ? data.label
            : formatLabel(new Date())
        );
        setGames(dbGames.length > 0 ? dbGames : [emptyGame()]);
      } else {
        // Nothing in shared draft — check legacy sessionStorage draft on this device
        const legacy = loadLegacyDraft();
        if (legacy) {
          setDate(legacy.date || todayISO());
          setLabel(legacy.label || formatLabel(new Date()));
          setGames(legacy.games.length > 0 ? legacy.games : [emptyGame()]);
          clearLegacyDraft();
          // Do NOT set skip flag — we want this to upload to the shared draft
        } else {
          setDate(todayISO());
          setLabel(formatLabel(new Date()));
        }
      }
      setHydrated(true);
    })();

    const channel: RealtimeChannel = supabase
      .channel("session_drafts_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_drafts",
          filter: "id=eq.1",
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<string, unknown> | null;
          if (!row) return;
          if (row.updated_by === clientIdRef.current) return; // ignore our own echo

          skipNextPersistRef.current = true;
          const incomingDate = typeof row.played_at === "string" ? row.played_at : "";
          const incomingLabel = typeof row.label === "string" ? row.label : "";
          const incomingGames = normalizeGames(row.games);
          setDate(incomingDate || todayISO());
          setLabel(
            incomingLabel.length > 0 ? incomingLabel : formatLabel(new Date())
          );
          setGames(incomingGames.length > 0 ? incomingGames : [emptyGame()]);
        }
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Debounced persist to Supabase
  useEffect(() => {
    if (!hydrated) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    const supabase = supabaseRef.current;
    if (!supabase) return;

    const timeout = setTimeout(() => {
      void supabase.from("session_drafts").upsert({
        id: 1,
        played_at: date || null,
        label,
        games,
        updated_by: clientIdRef.current,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [date, label, games, hydrated]);

  function handleDateChange(value: string) {
    setDate(value);
    const parsed = new Date(value + "T00:00:00");
    if (!isNaN(parsed.getTime())) {
      setLabel(formatLabel(parsed));
    }
  }

  function updateGame(index: number, field: "place" | "kills", value: string) {
    setGames((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  }

  function cycleMap(index: number) {
    setGames((prev) =>
      prev.map((g, i) => (i === index ? { ...g, map: nextMap(g.map) } : g))
    );
  }

  function addGame() {
    setGames((prev) => [...prev, emptyGame()]);
  }

  function removeGame(index: number) {
    setGames((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date || !label.trim()) {
      setError("Date and label are required.");
      return;
    }

    if (games.length === 0) {
      setError("At least 1 game is required.");
      return;
    }

    const parsedGames: { place: number; kills: number; map: MapName }[] = [];
    for (let i = 0; i < games.length; i++) {
      const place = parseInt(games[i].place, 10);
      const kills = parseInt(games[i].kills, 10);
      const map = games[i].map;

      if (isNaN(place) || place < 1 || place > 100) {
        setError(`Game ${i + 1}: Place must be 1-100.`);
        return;
      }
      if (isNaN(kills) || kills < 0 || kills > 99) {
        setError(`Game ${i + 1}: Kills must be 0-99.`);
        return;
      }
      if (map === null) {
        setError(`Game ${i + 1}: Tap the map button to pick a map.`);
        return;
      }
      parsedGames.push({ place, kills, map });
    }

    setSaving(true);
    try {
      const supabase = createClient();
      await createSession(supabase, {
        played_at: date,
        label: label.trim(),
        games: parsedGames,
      });
      // Reset the shared draft for every device
      await supabase.from("session_drafts").upsert({
        id: 1,
        played_at: null,
        label: null,
        games: [],
        updated_by: clientIdRef.current,
      });
      router.push("/sessions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session.");
    } finally {
      setSaving(false);
    }
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-5 pt-6 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Log Session
        </h1>
        <div
          className="flex items-center gap-1.5 text-xs text-muted"
          aria-live="polite"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              live ? "bg-green-bright" : "bg-muted"
            }`}
          />
          {live ? "Live" : "Offline"}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date + Label */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
            />
          </div>
        </div>

        {/* Games — compact table */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
              Games
            </h2>
            <span className="text-xs text-muted">{games.length} game{games.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[28px_1fr_1fr_1.4fr_28px] gap-2 px-3 py-2 border-b border-border">
              <span className="text-xs font-medium text-muted">#</span>
              <span className="text-xs font-medium text-muted">Place</span>
              <span className="text-xs font-medium text-muted">Kills</span>
              <span className="text-xs font-medium text-muted">Map</span>
              <span />
            </div>

            {/* Rows */}
            {games.map((game, index) => (
              <div
                key={index}
                className={`grid grid-cols-[28px_1fr_1fr_1.4fr_28px] gap-2 items-center px-3 py-1.5 ${
                  index < games.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <span className="text-sm font-medium text-muted">{index + 1}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  placeholder="1-100"
                  value={game.place}
                  onChange={(e) => updateGame(index, "place", e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted/50"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder="0-99"
                  value={game.kills}
                  onChange={(e) => updateGame(index, "kills", e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted/50"
                />
                <button
                  type="button"
                  onClick={() => cycleMap(index)}
                  aria-label={
                    game.map
                      ? `Map: ${game.map}. Tap to change.`
                      : "Tap to pick a map"
                  }
                  className={`w-full rounded-md px-2 py-1.5 text-xs font-medium text-center truncate transition-colors border ${
                    game.map
                      ? "bg-background border-blue text-foreground"
                      : "bg-background border-border text-muted/70"
                  }`}
                >
                  {game.map ?? "Tap to pick"}
                </button>
                {games.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeGame(index)}
                    className="flex items-center justify-center text-muted hover:text-red transition-colors text-base leading-none"
                  >
                    &times;
                  </button>
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addGame}
            className="mt-2 w-full rounded-lg border border-dashed border-border py-2 text-sm font-medium text-muted hover:border-blue hover:text-blue transition-colors"
          >
            + Add Game
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue text-white rounded-lg py-3 font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Session"}
        </button>
      </form>
    </div>
  );
}
