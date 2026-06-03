import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getDailyStats } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const days = Number.parseInt(url.searchParams.get("days") ?? "30", 10);
    return NextResponse.json(await getDailyStats(Number.isFinite(days) ? days : 30));
  } catch (error) {
    return jsonError(error);
  }
}
