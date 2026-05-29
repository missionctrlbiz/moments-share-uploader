import { NextResponse } from "next/server";
import { checkKvConnection } from "@/lib/kv";

export const dynamic = "force-dynamic";

export async function GET() {
  const [kvStatus] = await Promise.all([checkKvConnection()]);

  const allOk = kvStatus.connected;

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      kv: kvStatus,
      tips: kvStatus.connected
        ? undefined
        : [
            "KV not connected — uploads will succeed but won't persist in admin.",
            "Go to https://vercel.com/dashboard → your project → Storage → Connect KV",
            "Or create one at https://console.upstash.com → Redis → Create",
          ],
    },
    { status: allOk ? 200 : 503 }
  );
}
