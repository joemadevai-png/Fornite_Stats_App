"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { createSession } from "@/lib/queries";
import { MapName } from "@/lib/types";
import { useSharedDraft, FocusTarget } from "@/lib/draft/useSharedDraft";
import { emptyGame } from "@/lib/draft/types";
import { clearMirror } from "@/lib/draft/storage";
import SyncIndicator from "./SyncIndicator";

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

function formatLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function LogSessionPage() {
  const router = useRouter();

  const [focusedField, setFocusedField] = useState<{ row: number; field: FieldName } | null>(null);
  const [headerFocus, setHeaderFocus] = useState<"date" | "label" | null>(null);
  const [availableMaps, setAvailableMaps] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearArmed, setClearArmed] = useState(false);

  const focusedFieldRef = useRef(focusedField);
  focusedFieldRef.current = focusedField;
  const headerFocusRef = useRef(headerFocus);
  headerFocusRef.current = headerFocus;

  // Read through refs: the hook holds this callback for its whole lifetime.
  const getFocusTarget = useCallback((): FocusTarget => {
    if (headerFocusRef.current === "date") return { kind: "date" };
    if (headerFocusRef.current === "label") return { kind: "label" };
    const f = focusedFieldRef.current;
    return f ? { kind: "cell", row: f.row, field: f.field } : null;
  }, []);

  const { doc, ready, edit, clear, status, recovery, presenceCount, retry } =
    useSharedDraft({ getFocusTarget });

  const { date, label, games } = doc;

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
  // stepper label is deferred and any incoming focus cancels it.
  const cancelPendingBlur = useCallback(() => {
    if (blurTimerRef.current !== null) {
      window.clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  }, []);

  const handleFieldFocus = useCallback(
    (row: number, field: FieldName) => {
      cancelPendingBlur();
      setHeaderFocus(null);
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
        // it requires. It throws where unsupported, so failure just leaves the
        // select focused for a manual tap.
        try {
          (el as HTMLSelectElement & { showPicker?: () => void }).showPicker?.();
        } catch {
          // fall back to plain focus
        }
      }
      setHeaderFocus(null);
      setFocusedField({ row, field });
    },
    [cancelPendingBlur]
  );

  useEffect(() => () => cancelPendingBlur(), [cancelPendingBlur]);

  // Maps list. Independent of the draft document, so it stays in the page.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const loadMaps = async () => {
      const { data, error: mapsError } = await supabase
        .from("maps")
        .select("name")
        .order("created_at", { ascending: true });
      if (cancelled || mapsError || !data) return;
      setAvailableMaps(data.map((m: { name: string }) => m.name));
    };

    void loadMaps();

    const mapsChannel: RealtimeChannel = supabase
      .channel("maps_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "maps" }, () => {
        void loadMaps();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(mapsChannel);
    };
  }, []);

  // ------------------------------------------------------------- mutations --
  // Everything below goes through edit(), which is the only path that writes.

  function handleDateChange(value: string) {
    const parsed = new Date(value + "T00:00:00");
    const nextLabel = isNaN(parsed.getTime()) ? undefined : formatLabel(parsed);
    edit((d) => ({ ...d, date: value, label: nextLabel ?? d.label }));
  }

  function updateGame(index: number, field: "place" | "kills", value: string) {
    edit((d) => ({
      ...d,
      games: d.games.map((g, i) => (i === index ? { ...g, [field]: value } : g)),
    }));
  }

  function setMap(index: number, value: string) {
    edit((d) => ({
      ...d,
      games: d.games.map((g, i) =>
        i === index ? { ...g, map: value === "" ? null : value } : g
      ),
    }));
  }

  // flushSync so the new row exists before we focus it. On iOS a focus() that
  // lands in a later task loses the user gesture and the keyboard closes.
  function addGame() {
    const newIndex = games.length;
    flushSync(() => {
      edit((d) => ({ ...d, games: [...d.games, emptyGame()] }));
    });
    focusField(newIndex, "place");
  }

  function removeGame(index: number) {
    edit((d) => ({ ...d, games: d.games.filter((_, i) => i !== index) }));
    setFocusedField(null);
  }

  // ---------------------------------------------------------- field stepper --

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

  // ------------------------------------------------------------------ clear --

  function handleClear() {
    if (!clearArmed) {
      setClearArmed(true);
      window.setTimeout(() => setClearArmed(false), 3000);
      return;
    }
    setClearArmed(false);
    setFocusedField(null);
    void clear();
  }

  // ----------------------------------------------------------------- submit --

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
        setError(`Game ${i + 1}: Pick a map.`);
        return;
      }
      parsedGames.push({ place, kills, map });
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      await createSession(supabase, {
        played_at: date,
        label: label.trim(),
        games: parsedGames,
      });
      // Reset the shared draft for every device, then start fresh here.
      await clear();
      clearMirror();
      // Drop the client router cache so Dashboard / Fun Facts / Sessions all
      // recompute with the session that was just saved
      router.refresh();
      router.push("/sessions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session.");
    } finally {
      setSubmitting(false);
    }
  }

  // Same-height skeleton rather than null, so returning to this tab doesn't
  // flash a blank screen.
  if (!ready) {
    return (
      <div className="space-y-5 pt-6 pb-4" aria-busy="true">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-surface" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-[70px] animate-pulse rounded-lg bg-surface" />
          <div className="h-[70px] animate-pulse rounded-lg bg-surface" />
        </div>
        <div className="h-32 animate-pulse rounded-xl bg-surface" />
        <div className="h-12 animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-6 pb-4">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Log Session
        </h1>
        <SyncIndicator
          status={status}
          presenceCount={presenceCount}
          onRetry={() => void retry()}
        />
      </div>

      {recovery && (
        <div className="rounded-xl border border-orange/50 bg-orange/10 p-3">
          <p className="text-sm text-foreground">
            You had unsaved changes on this phone from before, but the log has
            changed since. Keep which one?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={recovery.restore}
              className="rounded-lg bg-orange px-3 py-2 text-xs font-semibold text-black"
            >
              Restore mine
            </button>
            <button
              type="button"
              onClick={recovery.discard}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted"
            >
              Discard mine
            </button>
          </div>
        </div>
      )}

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
              onFocus={() => setHeaderFocus("date")}
              onBlur={() => setHeaderFocus(null)}
              required
              className="block w-full min-w-0 appearance-none bg-surface border border-border rounded-lg px-3 py-3 text-base text-foreground"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => edit((d) => ({ ...d, label: e.target.value }))}
              onFocus={() => setHeaderFocus("label")}
              onBlur={() => setHeaderFocus(null)}
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

            {/* Rows.
                key={index} is deliberate. Index keys mean an incoming remote
                update patches `value` on the same DOM nodes instead of
                replacing them, so the caret and the iOS keyboard survive a
                sync. Stable ids would blow focus away on every remote apply. */}
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
          disabled={submitting}
          className="w-full bg-blue text-white rounded-lg py-4 font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Session"}
        </button>

        {/* Clear sits away from Save and the stepper: it wipes the other
            phone's in-progress typing too, so it reads as a danger zone.
            Two-tap arm instead of window.confirm, which iOS renders as a
            jarring blocking modal. */}
        <button
          type="button"
          onClick={handleClear}
          className={`w-full rounded-lg py-3 text-sm font-medium transition-colors ${
            clearArmed
              ? "border border-red bg-red/10 text-red"
              : "border border-border text-muted hover:border-red hover:text-red"
          }`}
        >
          {clearArmed ? "Clear draft? Tap again" : "Clear"}
        </button>
      </form>
    </div>
  );
}
