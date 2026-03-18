import { createClient } from "@/lib/supabase/server";
import { fetchAllSessions } from "@/lib/queries";
import { computeStats } from "@/lib/stats";
import DashboardContent from "./DashboardContent";

export default async function DashboardPage() {
  const supabase = await createClient();
  const sessions = await fetchAllSessions(supabase);
  const stats = sessions.length > 0 ? computeStats(sessions) : null;

  const dateRange =
    sessions.length > 0
      ? {
          first: sessions[sessions.length - 1].played_at,
          last: sessions[0].played_at,
        }
      : null;

  return <DashboardContent stats={stats} dateRange={dateRange} />;
}
