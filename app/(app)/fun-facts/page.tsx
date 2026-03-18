import { createClient } from "@/lib/supabase/server";
import { fetchAllSessions } from "@/lib/queries";
import { computeStats } from "@/lib/stats";
import FunFactsContent from "./FunFactsContent";

export default async function FunFactsPage() {
  const supabase = await createClient();
  const sessions = await fetchAllSessions(supabase);
  const stats = sessions.length > 0 ? computeStats(sessions) : null;

  return <FunFactsContent stats={stats} sessions={sessions} />;
}
