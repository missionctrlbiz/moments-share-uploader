import { NextResponse } from "next/server";
import {
  getRecentUploads,
  getDashboardStats,
  getUnviewedCount,
} from "@/lib/kv";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [uploads, stats, unviewedCount] = await Promise.all([
      getRecentUploads(50),
      getDashboardStats(),
      getUnviewedCount(),
    ]);

    return NextResponse.json({
      uploads,
      stats,
      unviewedCount,
    });
  } catch (error) {
    console.error("Files API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
