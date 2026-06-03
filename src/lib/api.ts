import { NextResponse } from "next/server";

export function jsonError(error: unknown, fallbackStatus = 500): NextResponse {
  if (error instanceof Error) {
    const status = typeof (error as Error & { status?: unknown }).status === "number"
      ? (error as Error & { status: number }).status
      : fallbackStatus;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ error: "Unexpected server error." }, { status: fallbackStatus });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const json = await request.json();
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw Object.assign(new Error("Request body must be a JSON object."), { status: 400 });
  }
  return json as Record<string, unknown>;
}
