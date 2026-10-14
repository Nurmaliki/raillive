import { getProvider } from "@/lib/providers";
import { toDateKey } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const station = searchParams.get("station");
  if (!station) {
    return Response.json({ error: "Parameter 'station' wajib diisi." }, { status: 400 });
  }
  const dateKey = searchParams.get("date") ?? toDateKey(new Date());
  const windowMinutes = Number(searchParams.get("window") ?? 240);

  const provider = getProvider();
  const departures = await provider.getDepartures(station.toUpperCase(), dateKey, windowMinutes);
  return Response.json({ station: station.toUpperCase(), date: dateKey, departures });
}
