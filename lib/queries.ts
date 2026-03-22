import { Session } from "./types";
import { SupabaseClient } from "@supabase/supabase-js";

export async function fetchAllSessions(supabase: SupabaseClient): Promise<Session[]> {
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("*")
    .is("archived_at", null)
    .order("played_at", { ascending: false });

  if (sessionsError) throw sessionsError;
  if (!sessions || sessions.length === 0) return [];

  return attachGames(supabase, sessions);
}

export async function fetchArchivedSessions(supabase: SupabaseClient): Promise<Session[]> {
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("*")
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  if (sessionsError) throw sessionsError;
  if (!sessions || sessions.length === 0) return [];

  return attachGames(supabase, sessions);
}

async function attachGames(supabase: SupabaseClient, sessions: Record<string, unknown>[]): Promise<Session[]> {
  const sessionIds = sessions.map((s) => s.id as string);
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
    id: s.id as string,
    played_at: s.played_at as string,
    label: s.label as string,
    created_at: s.created_at as string,
    archived_at: s.archived_at as string | null,
    games: (gamesBySession.get(s.id as string) || []).map((g) => ({
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

export async function archiveSession(supabase: SupabaseClient, sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function restoreSession(supabase: SupabaseClient, sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .update({ archived_at: null })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function deleteSession(supabase: SupabaseClient, sessionId: string): Promise<void> {
  const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
  if (error) throw error;
}
