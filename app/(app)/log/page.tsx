"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createSession } from "@/lib/queries";
import { MapName } from "@/lib/types";

const DRAFT_KEY = "fort-stats-draft";

function formatLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

interface GameDraft {
  place: string;
  kills: string;
  map: MapName | null;
}

interface Draft {
  date: string;
  label: string;
  games: GameDraft[];
}

function emptyGame(): GameDraft {
  return { place: "", kills: "", map: null };
}

function nextMap(cur: MapName | null): MapName | null {
  if (cur === null) return "Venture";
  if (cur === "Venture") return "Elite Stronghold";
  if (cur === "Elite Stronghold") return "Slurp Rush";
  return null; // Slurp Rush -> back to empty
}

function loadDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    // Backfill `map` on older drafts that predate the field
    const games = (parsed.games || []).map((g) => ({
      place: g.place ?? "",
      kills: g.kills ?? "",
      map: (g as GameDraft).map ?? null,
    }));
    return {
      date: parsed.date || "",
      label: parsed.label || "",
      games,
    };
  } catch {
    return null;
  }
}

function saveDraft(draft: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
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

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setDate(draft.date);
      setLabel(draft.label);
      setGames(draft.games.length > 0 ? draft.games : [emptyGame()]);
    } else {
      const today = new Date().toISOString().split("T")[0];
      setDate(today);
      setLabel(formatLabel(new Date()));
    }
    setHydrated(true);
  }, []);

  // Persist to sessionStorage on every change
  const persist = useCallback((d: string, l: string, g: GameDraft[]) => {
    saveDraft({ date: d, label: l, games: g });
  }, []);

  useEffect(() => {
    if (hydrated) {
      persist(date, label, games);
    }
  }, [date, label, games, hydrated, persist]);

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
      clearDraft();
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
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Log Session
      </h1>

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
