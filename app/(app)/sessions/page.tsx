import { createClient } from "@/lib/supabase/server";
import { fetchAllSessions, fetchArchivedSessions } from "@/lib/queries";
import SessionsContent from "./SessionsContent";

export default async function SessionsPage() {
  const supabase = await createClient();
  const [sessions, archivedSessions] = await Promise.all([
    fetchAllSessions(supabase),
    fetchArchivedSessions(supabase),
  ]);

  return <SessionsContent sessions={sessions} archivedSessions={archivedSessions} />;
}
