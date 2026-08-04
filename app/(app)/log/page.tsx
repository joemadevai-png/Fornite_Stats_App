"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
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

type FieldName = "place" | "kills" | "map";

const FIELD_ORDER: FieldName[] = ["place", "kills", "map"];

const FIELD_LABEL: Record<FieldName, string> = {
  place: "Place",
  kills: "Kills",
  map: "Map",
};

function fieldKey(row: number, field: FieldName): string {
  return `${row}-${field}`;
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
  const [availableMaps, setAvailableMaps] = useState<string[]>([]);

  const [focusedField, setFocusedField] = useState<{ row: number; field: FieldName } | null>(null);

  const clientIdRef = useRef<string>("");
  const skipNextPersistRef = useRef(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const availableMapsRef = useRef<string[]>([]);
  availableMapsRef.current = availableMaps;
  const fieldRefs = useRef<Map<string, HTMLInputElement | HTMLSelectElement>>(new Map());

  const blurTimerRef = useRef<number | null>(null);

  const registerField = useCallback(
    (row: number, field: FieldName) =>
      (el: HTMLInputElement | HTMLSelectElement | null) => {
        const k = fieldKey(row, field);
        if (el) fieldRefs.current.set(k, el);
        else fieldRefs.current.delete(k);
      },
    []
  );

  // Focus moving between two inputs fires blur before focus, so clearing the
  // bar is deferred and any incoming focus cancels it.
  const cancelPendingBlur = useCallback(() => {
    if (blurTimerRef.current !== null) {
      window.clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  }, []);

  const handleFieldFocus = useCallback(
    (row: number, field: FieldName) => {
      cancelPendingBlur();
      setFocusedField({ row, field });
    },
    [cancelPendingBlur]
  );

  const handleFieldBlur = useCallback(() => {
    cancelPendingBlur();
    blurTimerRef.current = window.setTimeout(() => setFocusedField(null), 150);
  }, [cancelPendingBlur]);

  const focusField = useCallback(
    (row: number, field: FieldName) => {
      const el = fieldRefs.current.get(fieldKey(row, field));
      if (!el) return;
      cancelPendingBlur();
      el.focus();
      if (el instanceof HTMLInputElement) {
        el.select();
      } else {
        // Focusing a <select> highlights it but doesn't open the iOS picker.
        // showPicker() does, and the stepper tap supplies the user activation
        // it requires. Not in every browser, and it throws when it can't run,
        // so a failure just leaves the select focused for a manual tap.
        try {
          (el as HTMLSelectElement & { showPicker?: () => void }).showPicker?.();
        } catch {
          // fall back to plain focus
        }
      }
      setFocusedField({ row, field });
    },
    [cancelPendingBlur]
  );

  useEffect(() => () => cancelPendingBlur(), [cancelPendingBlur]);

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
      const [{ data }, { data: mapsData }] = await Promise.all([
        supabase.from("session_drafts").select("*").eq("id", 1).maybeSingle(),
        supabase.from("maps").select("name").order("created_at", { ascending: true }),
      ]);

      if (cancelled) return;

      if (mapsData) {
        setAvailableMaps(mapsData.map((m: { name: string }) => m.name));
      }

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

    const mapsChannel: RealtimeChannel = supabase
      .channel("maps_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "maps" },
        async () => {
          const { data: fresh } = await supabase
            .from("maps")
            .select("name")
            .order("created_at", { ascending: true });
          if (fresh) setAvailableMaps(fresh.map((m: { name: string }) => m.name));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      supabase.removeChannel(mapsChannel);
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

  function setMap(index: number, value: string) {
    setGames((prev) =>
      prev.map((g, i) => (i === index ? { ...g, map: value === "" ? null : value } : g))
    );
  }

  // flushSync so the new row exists before we focus it. On iOS a focus() that
  // lands in a later task loses the user gesture and the keyboard closes.
  function addGame() {
    let newIndex = 0;
    flushSync(() => {
      setGames((prev) => {
        newIndex = prev.length;
        return [...prev, emptyGame()];
      });
    });
    focusField(newIndex, "place");
  }

  function removeGame(index: number) {
    setGames((prev) => prev.filter((_, i) => i !== index));
    setFocusedField(null);
  }

  // Nothing focused yet: jump to the first field that still needs a value.
  function focusFirstEmpty() {
    const row = games.findIndex((g) => !g.place || !g.kills || !g.map);
    if (row === -1) {
      focusField(0, "place");
      return;
    }
    const g = games[row];
    focusField(row, !g.place ? "place" : !g.kills ? "kills" : "map");
  }

  function focusPrevField() {
    if (!focusedField) {
      focusFirstEmpty();
      return;
    }
    const { row, field } = focusedField;
    const i = FIELD_ORDER.indexOf(field);
    if (i > 0) {
      focusField(row, FIELD_ORDER[i - 1]);
    } else if (row > 0) {
      focusField(row - 1, FIELD_ORDER[FIELD_ORDER.length - 1]);
    }
  }

  // place -> kills -> map -> next row's place. Past the last row's map, start a
  // new row so a whole session can be entered from the stepper alone.
  function focusNextField() {
    if (!focusedField) {
      focusFirstEmpty();
      return;
    }
    const { row, field } = focusedField;
    const i = FIELD_ORDER.indexOf(field);
    if (i < FIELD_ORDER.length - 1) {
      focusField(row, FIELD_ORDER[i + 1]);
    } else if (row < games.length - 1) {
      focusField(row + 1, FIELD_ORDER[0]);
    } else {
      addGame();
    }
  }

  function dismissKeyboard() {
    const { row, field } = focusedField ?? {};
    if (row !== undefined && field) {
      fieldRefs.current.get(fieldKey(row, field))?.blur();
    }
    setFocusedField(null);
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
      // Drop the client router cache so Dashboard / Fun Facts / Sessions all
      // recompute with the session that was just saved
      router.refresh();
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
        {/* Date + Label.
            min-w-0 matters: grid children default to min-width:auto, and the
            iOS date input's intrinsic width is wide enough to overflow its
            cell and sit under the Label field. */}
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              required
              className="block w-full min-w-0 appearance-none bg-surface border border-border rounded-lg px-3 py-3 text-base text-foreground"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="block w-full min-w-0 bg-surface border border-border rounded-lg px-3 py-3 text-base text-foreground"
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
            <div className="grid grid-cols-[22px_1fr_1fr_1.5fr_26px] gap-1.5 px-2.5 py-2 border-b border-border">
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
                className={`grid grid-cols-[22px_1fr_1fr_1.5fr_26px] gap-1.5 items-center px-2.5 py-2 ${
                  index < games.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <span className="text-sm font-medium text-muted">{index + 1}</span>
                <input
                  ref={registerField(index, "place")}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  placeholder="1-100"
                  value={game.place}
                  onChange={(e) => updateGame(index, "place", e.target.value)}
                  onFocus={() => handleFieldFocus(index, "place")}
                  onBlur={handleFieldBlur}
                  className="block w-full min-w-0 bg-background border border-border rounded-md px-2 py-2.5 text-base text-foreground placeholder:text-muted/50 focus:border-blue focus:outline-none"
                />
                <input
                  ref={registerField(index, "kills")}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder="0-99"
                  value={game.kills}
                  onChange={(e) => updateGame(index, "kills", e.target.value)}
                  onFocus={() => handleFieldFocus(index, "kills")}
                  onBlur={handleFieldBlur}
                  className="block w-full min-w-0 bg-background border border-border rounded-md px-2 py-2.5 text-base text-foreground placeholder:text-muted/50 focus:border-blue focus:outline-none"
                />
                <select
                  ref={registerField(index, "map")}
                  value={game.map ?? ""}
                  onChange={(e) => setMap(index, e.target.value)}
                  onFocus={() => handleFieldFocus(index, "map")}
                  onBlur={handleFieldBlur}
                  aria-label={`Map for game ${index + 1}`}
                  className={`block w-full min-w-0 rounded-md border px-2 py-2.5 text-base font-medium transition-colors focus:border-blue focus:outline-none ${
                    game.map
                      ? "bg-background border-blue text-foreground"
                      : "bg-background border-border text-muted/70"
                  }`}
                >
                  <option value="">Pick map</option>
                  {/* Keep a previously-chosen map selectable even if it was deleted */}
                  {game.map && !availableMaps.includes(game.map) && (
                    <option value={game.map}>{game.map}</option>
                  )}
                  {availableMaps.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
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
            className="mt-2 w-full rounded-lg border border-dashed border-border py-3 text-sm font-medium text-muted hover:border-blue hover:text-blue transition-colors"
          >
            + Add Game
          </button>
        </div>

        {/* Field stepper. The iOS numeric keypad has no Next key, so this is
            the stand-in for Tab. It sits in normal flow rather than pinned
            above the keyboard, because Safari's autofill toolbar (passwords /
            cards / addresses) covers anything docked there. onMouseDown is
            prevented so pressing a button doesn't blur the input and close the
            keyboard. */}
        <div
          className="flex items-center gap-2 rounded-xl border border-blue/50 bg-blue/10 p-2"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={focusPrevField}
            disabled={
              !!focusedField && focusedField.row === 0 && focusedField.field === "place"
            }
            aria-label="Previous field"
            className="min-h-[44px] min-w-[52px] rounded-lg border border-blue/50 bg-background text-lg font-semibold text-blue transition-opacity disabled:opacity-30"
          >
            &#8249;
          </button>
          <button
            type="button"
            onClick={focusNextField}
            aria-label="Next field"
            className="min-h-[44px] min-w-[52px] rounded-lg bg-blue text-lg font-semibold text-white transition-opacity hover:opacity-90"
          >
            &#8250;
          </button>
          <span className="flex-1 truncate text-center text-xs font-medium text-foreground">
            {focusedField
              ? `Game ${focusedField.row + 1} · ${FIELD_LABEL[focusedField.field]}`
              : "Tap › to start"}
          </span>
          <button
            type="button"
            onClick={dismissKeyboard}
            disabled={!focusedField}
            className="min-h-[44px] rounded-lg border border-blue/50 bg-background px-3 text-sm font-semibold text-blue transition-opacity disabled:opacity-30"
          >
            Done
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
          className="w-full bg-blue text-white rounded-lg py-4 font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Session"}
        </button>
      </form>
    </div>
  );
}
