import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getWordDetail } from "@/lib/discoveries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ word: string }>;
};

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const { word } = await context.params;
    const detail = await getWordDetail(decodeURIComponent(word));
    if (!detail) {
      return NextResponse.json({ error: "Word not found." }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    return jsonError(error);
  }
}
