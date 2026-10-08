import { NextResponse } from "next/server";

/**
 * Receives the crashes reported by `reportClientError()` and writes each one
 * as a single `[client-error]` line in the server logs (Vercel → Logs), where
 * the team can search them. Nothing is stored in the database.
 *
 * The route is public (a crash can happen to anyone), so it only accepts
 * same-origin calls, caps the body and keeps a fixed set of clipped fields.
 */

const MAX_BODY = 16_000;

const clip = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : undefined);

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && URL.canParse(origin) && new URL(origin).host !== request.headers.get("host")) {
    return new NextResponse(null, { status: 403 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return new NextResponse(null, { status: 413 });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  console.error(
    "[client-error]",
    JSON.stringify({
      reference: clip(body.reference, 40),
      area: clip(body.area, 40),
      name: clip(body.name, 100),
      message: clip(body.message, 1000),
      path: clip(body.path, 300),
      userId: clip(body.userId, 64),
      translated: body.translated === true,
      pageLang: clip(body.pageLang, 20),
      digest: clip(body.digest, 100),
      userAgent: clip(request.headers.get("user-agent"), 300),
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
      stack: clip(body.stack, 6000),
    })
  );

  return new NextResponse(null, { status: 204 });
}
