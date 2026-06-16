import { NextResponse } from "next/server";

/** Lightweight liveness probe for native connectivity checks. */
export function GET() {
  return NextResponse.json({ ok: true });
}
