import { getProvider } from "@/lib/providers";
import { toDateKey } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const dateKey = searchParams.get("date") ?? toDateKey(new Date());
  const provider = getProvider();
  const live = await provider.getLiveTrain(id, dateKey);
  if (!live) {
    return Response.json({ error: "Kereta tidak ditemukan atau tidak beroperasi." }, { status: 404 });
  }
  return Response.json(live);
}
