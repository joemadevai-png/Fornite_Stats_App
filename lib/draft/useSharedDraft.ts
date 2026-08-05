"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  DraftDoc,
  DraftRow,
  SyncStatus,
  emptyGame,
  freshDoc,
  rowToDoc,
} from "./types";
import {
  Mirror,
  clearMirror,
  getClientId,
  readMirror,
  takeLegacyDraft,
  writeMirror,
} from "./storage";

const ROW_COLUMNS = "played_at, label, games, updated_by, revision, updated_at";

const DEBOUNCE_MS = 300;
/** Cap on how long continuous typing can go unsent. */
const MAX_WAIT_MS = 2000;
const POLL_HOT_MS = 2000;
const POLL_IDLE_MS = 8000;
/** Below this much idle time we poll at the hot cadence. */
const HOT_WINDOW_MS = 90_000;
/** No successful read in this long and we stop claiming to be in sync. */
const STALE_AFTER_MS = 15_000;

export type FocusTarget =
  | { kind: "cell"; row: number; field: "place" | "kills" | "map" }
  | { kind: "date" }
  | { kind: "label" }
  | null;

export interface Recovery {
  doc: DraftDoc;
  restore: () => void;
  discard: () => void;
}

interface Options {
  /** Lets an incoming remote update leave the field being typed in alone. */
  getFocusTarget: () => FocusTarget;
}

export function useSharedDraft({ getFocusTarget }: Options) {
  const [doc, setDoc] = useState<DraftDoc>(() => freshDoc());
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState<Recovery | null>(null);
  const [presenceCount, setPresenceCount] = useState(1);

  // Status inputs. Kept as state because the UI renders them.
  const [saving, setSaving] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [lastReadAt, setLastReadAt] = useState(0);
  const [lastEditor, setLastEditor] = useState<"me" | "other" | null>(null);
  const [lastEditAt, setLastEditAt] = useState(0);
  const [online, setOnline] = useState(true);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (supabaseRef.current === null && typeof window !== "undefined") {
    supabaseRef.current = createClient();
  }

  const clientIdRef = useRef<string>("");
  const docRef = useRef<DraftDoc>(doc);
  /** Highest server revision already reflected in docRef. */
  const appliedRevisionRef = useRef(0);
  /** There are local edits not yet sent. */
  const pendingRef = useRef(false);
  /** A write is on the wire right now. */
  const inFlightRef = useRef(false);
  const writeFailuresRef = useRef(0);
  const lastChangeAtRef = useRef(Date.now());
  const debounceTimerRef = useRef<number | null>(null);
  const maxWaitTimerRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const setDocBoth = useCallback((next: DraftDoc) => {
    docRef.current = next;
    setDoc(next);
  }, []);

  const persistMirror = useCallback((next: DraftDoc, dirty: boolean) => {
    const mirror: Mirror = {
      doc: next,
      baseRevision: appliedRevisionRef.current,
      dirty,
      ts: Date.now(),
      clientId: clientIdRef.current,
    };
    writeMirror(mirror);
  }, []);

  // ---------------------------------------------------------------- writes --

  const performSave = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;

    inFlightRef.current = true;
    setSaving(true);

    const snapshot = docRef.current;
    const { data, error } = await supabase
      .from("session_drafts")
      .upsert(
        {
          id: 1,
          played_at: snapshot.date || null,
          label: snapshot.label,
          games: snapshot.games,
          updated_by: clientIdRef.current,
        },
        { onConflict: "id" }
      )
      .select(ROW_COLUMNS)
      .single();

    inFlightRef.current = false;
    if (!mountedRef.current) return;

    if (error) {
      writeFailuresRef.current += 1;
      // A network failure is "offline"; anything else is a real error worth showing.
      setWriteError(error.message || "Could not save");
      setSaving(false);
      // Keep the edits pending so a later retry picks them up.
      pendingRef.current = true;
      persistMirror(docRef.current, true);
      return;
    }

    writeFailuresRef.current = 0;
    setWriteError(null);
    const row = data as unknown as DraftRow;
    if (row.revision > appliedRevisionRef.current) {
      appliedRevisionRef.current = row.revision;
    }
    setLastReadAt(Date.now());
    setLastEditor("me");
    setLastEditAt(Date.now());
    setSaving(false);
    persistMirror(docRef.current, pendingRef.current);
  }, [persistMirror]);

  const flushNow = useCallback(async () => {
    if (!pendingRef.current || inFlightRef.current) return;
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (maxWaitTimerRef.current !== null) {
      window.clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
    pendingRef.current = false;
    await performSave();
    // Edits that landed mid-flight need another round trip.
    if (pendingRef.current && mountedRef.current) {
      void flushNow();
    }
  }, [performSave]);

  const scheduleSave = useCallback(() => {
    pendingRef.current = true;
    if (maxWaitTimerRef.current === null) {
      maxWaitTimerRef.current = window.setTimeout(() => {
        maxWaitTimerRef.current = null;
        void flushNow();
      }, MAX_WAIT_MS);
    }
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      void flushNow();
    }, DEBOUNCE_MS);
  }, [flushNow]);

  /**
   * The ONLY path that schedules a write. Hydration and remote updates
   * deliberately do not call this, which is what stops a freshly-mounted phone
   * from overwriting the other phone's in-progress draft.
   */
  const edit = useCallback(
    (updater: (prev: DraftDoc) => DraftDoc) => {
      const next = updater(docRef.current);
      setDocBoth(next);
      lastChangeAtRef.current = Date.now();
      persistMirror(next, true);
      scheduleSave();
    },
    [persistMirror, scheduleSave, setDocBoth]
  );

  const clear = useCallback(async () => {
    const blank: DraftDoc = { date: "", label: "", games: [emptyGame()] };
    setDocBoth(blank);
    lastChangeAtRef.current = Date.now();
    clearMirror();
    pendingRef.current = false;

    const supabase = supabaseRef.current;
    if (!supabase) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("session_drafts")
      .upsert(
        { id: 1, played_at: null, label: null, games: [], updated_by: clientIdRef.current },
        { onConflict: "id" }
      )
      .select(ROW_COLUMNS)
      .single();
    if (!mountedRef.current) return;
    setSaving(false);
    if (error) {
      setWriteError(error.message || "Could not clear");
      return;
    }
    setWriteError(null);
    const row = data as unknown as DraftRow;
    if (row.revision > appliedRevisionRef.current) {
      appliedRevisionRef.current = row.revision;
    }
    setLastReadAt(Date.now());
    setDocBoth(freshDoc());
  }, [setDocBoth]);

  // ----------------------------------------------------------------- reads --

  const applyRemote = useCallback(
    (row: DraftRow) => {
      // 1. Stale or already seen.
      if (row.revision <= appliedRevisionRef.current) return;

      // 2. Our own echo. Separate from (1) because a Realtime echo can arrive
      //    before our own upsert's HTTP response has told us the new revision.
      if (row.updated_by && row.updated_by === clientIdRef.current) {
        appliedRevisionRef.current = row.revision;
        return;
      }

      // 3. We have local edits that are about to become the newer revision.
      //    Applying here would rubber-band the user's own typing.
      if (pendingRef.current || inFlightRef.current) {
        appliedRevisionRef.current = row.revision;
        return;
      }

      let next = rowToDoc(row);

      // Keep whatever the user is actively typing in.
      const focus = getFocusTarget();
      const local = docRef.current;
      if (focus?.kind === "date") {
        next = { ...next, date: local.date };
      } else if (focus?.kind === "label") {
        next = { ...next, label: local.label };
      } else if (focus?.kind === "cell" && focus.row < next.games.length) {
        const games = next.games.slice();
        const localRow = local.games[focus.row];
        if (localRow) {
          games[focus.row] = { ...games[focus.row], [focus.field]: localRow[focus.field] };
          next = { ...next, games };
        }
      }

      appliedRevisionRef.current = row.revision;
      setDocBoth(next);
      lastChangeAtRef.current = Date.now();
      setLastEditor("other");
      setLastEditAt(Date.now());
      // Not dirty: this came from the server, it must not schedule a write.
      persistMirror(next, false);
    },
    [getFocusTarget, persistMirror, setDocBoth]
  );

  const refetchNow = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    // Don't read a row we're mid-way through replacing.
    if (inFlightRef.current) return;

    const { data, error } = await supabase
      .from("session_drafts")
      .select(ROW_COLUMNS)
      .eq("id", 1)
      .maybeSingle();

    if (!mountedRef.current) return;
    if (error) return; // leaves lastReadAt stale, which surfaces as Reconnecting
    setLastReadAt(Date.now());
    if (data) applyRemote(data as unknown as DraftRow);
  }, [applyRemote]);

  // ------------------------------------------------------------- lifecycle --

  useEffect(() => {
    mountedRef.current = true;
    clientIdRef.current = getClientId();
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);

    const supabase = supabaseRef.current;
    if (!supabase) return;

    let cancelled = false;

    // --- initial hydrate: server first, then reconcile the local mirror -----
    (async () => {
      const { data, error } = await supabase
        .from("session_drafts")
        .select(ROW_COLUMNS)
        .eq("id", 1)
        .maybeSingle();

      if (cancelled || !mountedRef.current) return;

      const row = (data as unknown as DraftRow | null) ?? null;
      const mirror = readMirror();
      const serverRevision = row?.revision ?? 0;

      if (!error && row) {
        appliedRevisionRef.current = serverRevision;
        setLastReadAt(Date.now());
        setLastEditor(
          row.updated_by ? (row.updated_by === clientIdRef.current ? "me" : "other") : null
        );
      }

      const serverDoc = row ? rowToDoc(row) : null;
      const serverHasContent =
        !!row && !!(row.played_at || row.label || (Array.isArray(row.games) && row.games.length > 0));

      if (mirror?.dirty) {
        if (error) {
          // Couldn't read the server; trust local and keep trying.
          setDocBoth(mirror.doc);
          pendingRef.current = true;
          scheduleSave();
        } else if (serverRevision === mirror.baseRevision) {
          // Our unsaved edits sit directly on top of current server state.
          setDocBoth(mirror.doc);
          pendingRef.current = true;
          scheduleSave();
        } else {
          // Server moved on while we were away. Don't guess: show the server
          // copy and let the user decide what to do with the local one.
          setDocBoth(serverDoc ?? freshDoc());
          setRecovery({
            doc: mirror.doc,
            restore: () => {
              setDocBoth(mirror.doc);
              lastChangeAtRef.current = Date.now();
              persistMirror(mirror.doc, true);
              pendingRef.current = true;
              scheduleSave();
              setRecovery(null);
            },
            discard: () => {
              clearMirror();
              setRecovery(null);
            },
          });
        }
      } else if (serverHasContent && serverDoc) {
        setDocBoth(serverDoc);
        persistMirror(serverDoc, false);
      } else {
        // Nothing on the server. Last-resort pre-shared-draft fallback.
        const legacy = takeLegacyDraft();
        if (legacy) {
          const restored: DraftDoc = {
            date: legacy.date || freshDoc().date,
            label: legacy.label || freshDoc().label,
            games: legacy.games.length > 0 ? legacy.games : [emptyGame()],
          };
          setDocBoth(restored);
          lastChangeAtRef.current = Date.now();
          persistMirror(restored, true);
          scheduleSave();
        } else {
          // IMPORTANT: fresh state is shown but never written. A mount must not
          // be able to blank out what the other phone is typing.
          setDocBoth(freshDoc());
        }
      }

      setReady(true);
    })();

    // --- polling: the correctness path ------------------------------------
    const scheduleNextPoll = () => {
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      if (typeof document !== "undefined" && document.hidden) return;
      const hot = Date.now() - lastChangeAtRef.current < HOT_WINDOW_MS;
      pollTimerRef.current = window.setTimeout(async () => {
        await refetchNow();
        if (mountedRef.current) scheduleNextPoll();
      }, hot ? POLL_HOT_MS : POLL_IDLE_MS);
    };
    scheduleNextPoll();

    // --- resync triggers ---------------------------------------------------
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setOnline(navigator.onLine);
        void refetchNow();
        scheduleNextPoll();
        // The socket is usually dead after a background; nudge it.
        try {
          supabase.realtime.connect();
        } catch {
          // best effort
        }
      } else {
        if (pollTimerRef.current !== null) {
          window.clearTimeout(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        void flushNow();
      }
    };
    const onPageShow = () => {
      void refetchNow();
      scheduleNextPoll();
    };
    const onFocus = () => void refetchNow();
    const onOnline = () => {
      setOnline(true);
      void refetchNow();
      if (pendingRef.current) void flushNow();
    };
    const onOffline = () => setOnline(false);
    const onPageHide = () => void flushNow();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("pagehide", onPageHide);

    // --- realtime: latency optimization only -------------------------------
    const channel: RealtimeChannel = supabase
      .channel("session_drafts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_drafts", filter: "id=eq.1" },
        (payload) => {
          const row = payload.new as unknown as DraftRow | null;
          if (!row || typeof row.revision !== "number") return;
          applyRemote(row);
        }
      )
      .subscribe((status) => {
        // Between socket death and resubscribe we missed events and the socket
        // will not tell us, so always re-read on (re)subscribe.
        if (status === "SUBSCRIBED") void refetchNow();
      });

    // --- presence ----------------------------------------------------------
    const presence: RealtimeChannel = supabase.channel("log_presence", {
      config: { presence: { key: clientIdRef.current } },
    });
    presence
      .on("presence", { event: "sync" }, () => {
        if (!mountedRef.current) return;
        setPresenceCount(Object.keys(presence.presenceState()).length || 1);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void presence.track({ at: Date.now() });
        }
      });

    // --- ticker so "edited 4s ago" and staleness advance -------------------
    const tick = window.setInterval(() => {
      if (mountedRef.current) setNowTick(Date.now());
    }, 1000);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("pagehide", onPageHide);
      window.clearInterval(tick);
      if (pollTimerRef.current !== null) window.clearTimeout(pollTimerRef.current);
      if (debounceTimerRef.current !== null) window.clearTimeout(debounceTimerRef.current);
      if (maxWaitTimerRef.current !== null) window.clearTimeout(maxWaitTimerRef.current);
      // Tab navigation is same-document, so a fetch started here still lands.
      if (pendingRef.current && !inFlightRef.current) {
        const snapshot = docRef.current;
        void supabase
          .from("session_drafts")
          .upsert(
            {
              id: 1,
              played_at: snapshot.date || null,
              label: snapshot.label,
              games: snapshot.games,
              updated_by: clientIdRef.current,
            },
            { onConflict: "id" }
          );
      }
      supabase.removeChannel(channel);
      supabase.removeChannel(presence);
    };
    // Intentionally mount-only; all moving parts are refs or stable callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------- status --

  const status: SyncStatus = useMemo(() => {
    if (!ready) return { kind: "loading" };
    if (writeError && writeFailuresRef.current > 0 && online) {
      return { kind: "error", message: writeError };
    }
    if (!online || writeFailuresRef.current >= 2) return { kind: "offline" };
    if (saving || pendingRef.current) return { kind: "saving" };
    if (lastReadAt > 0 && nowTick - lastReadAt > STALE_AFTER_MS) return { kind: "stale" };
    return { kind: "saved", lastServerAt: lastReadAt, lastEditor, lastEditAt };
  }, [ready, writeError, online, saving, lastReadAt, lastEditor, lastEditAt, nowTick]);

  return { doc, ready, edit, clear, status, recovery, presenceCount, retry: flushNow };
}
