import { getProvider, providerInfo } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = getProvider();
  const stations = await provider.getStations();
  return Response.json({
    ...providerInfo(),
    count: stations.length,
    stations,
  });
}
