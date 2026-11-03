import { createClient } from "@/lib/supabase/server";
import { fetchAllSessions } from "@/lib/queries";
import { computeStats } from "@/lib/stats";
import MapsContent from "./MapsContent";

export const dynamic = "force-dynamic";

export default async function MapsPage() {
  const supabase = await createClient();
  const sessions = await fetchAllSessions(supabase);
  const stats = sessions.length > 0 ? computeStats(sessions) : null;

  return <MapsContent mapStats={stats?.mapStats ?? []} />;
}
