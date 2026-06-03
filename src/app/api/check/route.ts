import { NextResponse } from "next/server";
import { jsonError, readJsonObject } from "@/lib/api";
import { checkAndRecordWord } from "@/lib/discoveries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await readJsonObject(request);
    const word = body.word;
    if (typeof word !== "string") {
      return NextResponse.json({ error: "Word must be text." }, { status: 400 });
    }

    const result = await checkAndRecordWord(word);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
