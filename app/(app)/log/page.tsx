"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createSession } from "@/lib/queries";

function formatLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function LogSessionPage() {
  const router = useRouter();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [label, setLabel] = useState(formatLabel(new Date()));
  const [games, setGames] = useState([{ place: "", kills: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function addGame() {
    setGames((prev) => [...prev, { place: "", kills: "" }]);
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

    const parsedGames: { place: number; kills: number }[] = [];
    for (let i = 0; i < games.length; i++) {
      const place = parseInt(games[i].place, 10);
      const kills = parseInt(games[i].kills, 10);

      if (isNaN(place) || place < 1 || place > 100) {
        setError(`Game ${i + 1}: Place must be between 1 and 100.`);
        return;
      }
      if (isNaN(kills) || kills < 0 || kills > 99) {
        setError(`Game ${i + 1}: Kills must be between 0 and 99.`);
        return;
      }
      parsedGames.push({ place, kills });
    }

    setSaving(true);
    try {
      const supabase = createClient();
      await createSession(supabase, {
        played_at: date,
        label: label.trim(),
        games: parsedGames,
      });
      router.push("/sessions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pt-6 pb-4">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Log Session
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date + Label */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm text-muted">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-muted">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </div>
        </div>

        {/* Games */}
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            Games
          </h2>

          {games.map((game, index) => (
            <div
              key={index}
              className="bg-surface rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">
                  Game {index + 1}
                </span>
                {games.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGame(index)}
                    className="text-muted hover:text-red transition-colors text-lg leading-none px-1"
                  >
                    &times;
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">Place</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    placeholder="1-100"
                    value={game.place}
                    onChange={(e) => updateGame(index, "place", e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Kills</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={99}
                    placeholder="0-99"
                    value={game.kills}
                    onChange={(e) => updateGame(index, "kills", e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addGame}
            className="w-full rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted hover:border-muted-foreground hover:text-muted-foreground transition-colors"
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
