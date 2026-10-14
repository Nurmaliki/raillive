import { getProvider } from "@/lib/providers";
import { toDateKey } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateKey = searchParams.get("date") ?? toDateKey(new Date());
  const provider = getProvider();
  const alerts = await provider.getAlerts(dateKey);
  return Response.json({ date: dateKey, count: alerts.length, alerts });
}
