import { getProvider, providerInfo } from "@/lib/providers";
import { toDateKey } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateKey = searchParams.get("date") ?? toDateKey(new Date());
  const provider = getProvider();
  const trains = await provider.getLiveTrains(dateKey);
  return Response.json({
    ...providerInfo(),
    date: dateKey,
    updatedAt: new Date().toISOString(),
    count: trains.length,
    trains,
  });
}
