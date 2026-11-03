"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapStat } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface MapRow {
  name: string;
  last_used_at: string | null;
}

/** null = normal; otherwise the row is showing one action's controls. */
type RowMode = "rename" | "merge" | "delete";

const MAX_NAME = 40;

function formatUsed(iso: string | null): string {
  if (!iso) return "never played";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "never played";
  return `last played ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function MapsContent({ mapStats }: { mapStats: MapStat[] }) {
  const router = useRouter();

  const [maps, setMaps] = useState<MapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [openRow, setOpenRow] = useState<string | null>(null);
  const [rowMode, setRowMode] = useState<RowMode | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");

  const gameCount = useCallback(
    (name: string) => mapStats.find((m) => m.map === name)?.games ?? 0,
    [mapStats]
  );

  const loadMaps = useCallback(async () => {
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("maps")
      .select("name, last_used_at")
      // Same order the Log dropdown uses, so what you see here is what you get there
      .order("last_used_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: true });
    setLoading(false);
    if (loadError) {
      setError(loadError.message);
      return;
    }
    setMaps((data ?? []) as MapRow[]);
  }, []);

  useEffect(() => {
    void loadMaps();
  }, [loadMaps]);

  function closeRow() {
    setOpenRow(null);
    setRowMode(null);
    setRenameValue("");
    setMergeTarget("");
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  }

  /** Re-reads both the map list and the server-rendered game counts. */
  async function refreshAll() {
    await loadMaps();
    router.refresh();
  }

  async function addMap(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Give the map a name.");
      return;
    }
    if (trimmed.length > MAX_NAME) {
      setError(`Keep it under ${MAX_NAME} characters.`);
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("maps").insert({ name: trimmed });
      if (insertError) {
        setError(
          insertError.code === "23505"
            ? "You already have a map with that name."
            : insertError.message
        );
        return;
      }
      setNewName("");
      flash(`Added "${trimmed}".`);
      await refreshAll();
    } finally {
      setBusy(false);
    }
  }

  async function renameMap(oldName: string) {
    setError(null);
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setError("Give the map a name.");
      return;
    }
    if (trimmed === oldName) {
      closeRow();
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      // Server-side function so maps.name and games.map change together.
      const { data, error: rpcError } = await supabase.rpc("rename_map", {
        p_old: oldName,
        p_new: trimmed,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      const moved = typeof data === "number" ? data : 0;
      flash(
        moved > 0
          ? `Renamed to "${trimmed}" and updated ${moved} logged game${moved === 1 ? "" : "s"}.`
          : `Renamed to "${trimmed}".`
      );
      closeRow();
      await refreshAll();
    } finally {
      setBusy(false);
    }
  }

  async function mergeMap(fromName: string) {
    setError(null);
    if (!mergeTarget) {
      setError("Pick the map to merge into.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("merge_maps", {
        p_from: fromName,
        p_into: mergeTarget,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      const moved = typeof data === "number" ? data : 0;
      flash(
        `Merged "${fromName}" into "${mergeTarget}"` +
          (moved > 0 ? `, moving ${moved} game${moved === 1 ? "" : "s"}.` : ".")
      );
      closeRow();
      await refreshAll();
    } finally {
      setBusy(false);
    }
  }

  async function deleteMap(name: string) {
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase.from("maps").delete().eq("name", name);
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
      flash(`Deleted "${name}".`);
      closeRow();
      await refreshAll();
    } finally {
      setBusy(false);
    }
  }

  const totalTagged = mapStats.reduce((a, m) => a + m.games, 0);

  return (
    <div className="space-y-5 pt-6 pb-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Maps</h1>
        <p className="mt-2 text-xs text-muted">
          {maps.length} map{maps.length === 1 ? "" : "s"} / {totalTagged} tagged games
        </p>
      </div>

      {/* Add sits at the top: it's the thing you came here to do most often */}
      <form onSubmit={addMap} className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="New map name"
          maxLength={MAX_NAME}
          disabled={busy}
          className="block w-full min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-3 text-base text-foreground placeholder:text-muted/50 focus:border-blue focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-lg bg-blue px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {notice && <p className="text-sm text-green-bright">{notice}</p>}
      {error && <p className="text-sm text-red">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          <div className="h-16 animate-pulse rounded-xl bg-surface" />
          <div className="h-16 animate-pulse rounded-xl bg-surface" />
          <div className="h-16 animate-pulse rounded-xl bg-surface" />
        </div>
      ) : maps.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          No maps yet. Add your first one above.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {maps.map((m) => {
            const count = gameCount(m.name);
            const isOpen = openRow === m.name;
            const others = maps.filter((x) => x.name !== m.name);

            return (
              <li
                key={m.name}
                className="rounded-xl border border-border bg-surface p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-base font-medium text-foreground">
                    {m.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {count} game{count === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted">{formatUsed(m.last_used_at)}</p>

                {!isOpen && (
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        closeRow();
                        setOpenRow(m.name);
                        setRowMode("rename");
                        setRenameValue(m.name);
                      }}
                      className="text-xs font-medium text-blue"
                    >
                      Rename
                    </button>
                    {others.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          closeRow();
                          setOpenRow(m.name);
                          setRowMode("merge");
                          setMergeTarget("");
                        }}
                        className="text-xs font-medium text-blue"
                      >
                        Merge
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        closeRow();
                        setOpenRow(m.name);
                        setRowMode("delete");
                      }}
                      className="text-xs font-medium text-muted transition-colors hover:text-red"
                    >
                      Delete
                    </button>
                  </div>
                )}

                {isOpen && rowMode === "rename" && (
                  <div className="mt-3 space-y-2">
                    <input
                      autoFocus
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      maxLength={MAX_NAME}
                      className="block w-full min-w-0 rounded-lg border border-blue bg-background px-3 py-2.5 text-base text-foreground focus:outline-none"
                    />
                    {count > 0 && (
                      <p className="text-[11px] text-muted">
                        {count} logged game{count === 1 ? "" : "s"} will be updated to the
                        new name too, so your map stats stay together.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => renameMap(m.name)}
                        className="rounded-lg bg-blue px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={closeRow}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {isOpen && rowMode === "merge" && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={mergeTarget}
                      onChange={(e) => setMergeTarget(e.target.value)}
                      aria-label={`Merge ${m.name} into`}
                      className="block w-full min-w-0 rounded-lg border border-blue bg-background px-3 py-2.5 text-base text-foreground focus:outline-none"
                    >
                      <option value="">Merge into...</option>
                      {others.map((o) => (
                        <option key={o.name} value={o.name}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted">
                      {count > 0
                        ? `All ${count} game${count === 1 ? "" : "s"} move across and "${m.name}" is removed.`
                        : `"${m.name}" is removed.`}{" "}
                      This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy || !mergeTarget}
                        onClick={() => mergeMap(m.name)}
                        className="rounded-lg bg-orange px-3 py-2 text-xs font-semibold text-black disabled:opacity-40"
                      >
                        Merge
                      </button>
                      <button
                        type="button"
                        onClick={closeRow}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {isOpen && rowMode === "delete" && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] text-muted">
                      {count > 0
                        ? `The ${count} game${count === 1 ? "" : "s"} already logged on this map keep their stats. It just stops showing up when logging.`
                        : "This map has no games logged on it."}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => deleteMap(m.name)}
                        className="rounded-lg border border-red bg-red/10 px-3 py-2 text-xs font-semibold text-red disabled:opacity-50"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={closeRow}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted"
                      >
                        Keep
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
