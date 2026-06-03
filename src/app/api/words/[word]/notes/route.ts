import { NextResponse } from "next/server";
import { jsonError, readJsonObject } from "@/lib/api";
import { addWordNote, clientIp, listWordNotes } from "@/lib/notes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ word: string }>;
};

export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const { word } = await context.params;
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
    return NextResponse.json({ notes: await listWordNotes(decodeURIComponent(word), Number.isFinite(limit) ? limit : 50) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const { word } = await context.params;
    const body = await readJsonObject(request);
    const note = await addWordNote(decodeURIComponent(word), body.body, clientIp(request.headers));
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
