import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getStatsSummary } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(await getStatsSummary());
  } catch (error) {
    return jsonError(error);
  }
}
