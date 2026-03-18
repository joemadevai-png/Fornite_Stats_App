import { createClient } from "@/lib/supabase/server";
import { fetchAllSessions } from "@/lib/queries";
import SessionsContent from "./SessionsContent";

export default async function SessionsPage() {
  const supabase = await createClient();
  const sessions = await fetchAllSessions(supabase);

  return <SessionsContent sessions={sessions} />;
}
