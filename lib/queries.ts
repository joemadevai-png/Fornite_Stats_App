import { Session } from "./types";
import { SupabaseClient } from "@supabase/supabase-js";

export async function fetchAllSessions(supabase: SupabaseClient): Promise<Session[]> {
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("*")
    .order("played_at", { ascending: false });

  if (sessionsError) throw sessionsError;
  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("*")
    .in("session_id", sessionIds)
    .order("game_order", { ascending: true });

  if (gamesError) throw gamesError;

  const gamesBySession = new Map<string, typeof games>();
  (games || []).forEach((g) => {
    const existing = gamesBySession.get(g.session_id) || [];
    existing.push(g);
    gamesBySession.set(g.session_id, existing);
  });

  return sessions.map((s) => ({
    id: s.id,
    played_at: s.played_at,
    label: s.label,
    created_at: s.created_at,
    games: (gamesBySession.get(s.id) || []).map((g) => ({
      id: g.id,
      session_id: g.session_id,
      game_order: g.game_order,
      place: g.place,
      kills: g.kills,
    })),
  }));
}

export async function createSession(
  supabase: SupabaseClient,
  session: { played_at: string; label: string; games: { place: number; kills: number }[] }
): Promise<string> {
  const { data, error: sessionError } = await supabase
    .from("sessions")
    .insert({ played_at: session.played_at, label: session.label })
    .select("id")
    .single();

  if (sessionError) throw sessionError;

  const sessionId = data.id;
  const gameRows = session.games.map((g, i) => ({
    session_id: sessionId,
    game_order: i + 1,
    place: g.place,
    kills: g.kills,
  }));

  const { error: gamesError } = await supabase.from("games").insert(gameRows);
  if (gamesError) throw gamesError;

  return sessionId;
}

export async function deleteSession(supabase: SupabaseClient, sessionId: string): Promise<void> {
  const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
  if (error) throw error;
}
