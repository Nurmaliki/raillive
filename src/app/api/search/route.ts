import { getProvider } from "@/lib/providers";
import { toDateKey } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  if (!origin || !destination) {
    return Response.json(
      { error: "Parameter 'origin' dan 'destination' wajib diisi." },
      { status: 400 },
    );
  }
  const dateKey = searchParams.get("date") ?? toDateKey(new Date());
  const provider = getProvider();
  const journeys = await provider.searchJourneys(
    origin.toUpperCase(),
    destination.toUpperCase(),
    dateKey,
  );
  return Response.json({
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    date: dateKey,
    count: journeys.length,
    journeys,
  });
}
