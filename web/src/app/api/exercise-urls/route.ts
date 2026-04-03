import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const KV_KEY = "exercise_urls";

// GET /api/exercise-urls -- returns all saved URLs
export async function GET() {
  try {
    const urls = await kv.get<Record<string, string>>(KV_KEY);
    return NextResponse.json(urls ?? {});
  } catch {
    return NextResponse.json({});
  }
}

// POST /api/exercise-urls -- save a URL { name: string, url: string }
export async function POST(req: Request) {
  const { name, url } = await req.json();
  if (!name || !url) {
    return NextResponse.json({ error: "name and url required" }, { status: 400 });
  }
  const urls = (await kv.get<Record<string, string>>(KV_KEY)) ?? {};
  urls[name] = url;
  await kv.set(KV_KEY, urls);
  return NextResponse.json({ ok: true });
}

// DELETE /api/exercise-urls -- remove a URL { name: string }
export async function DELETE(req: Request) {
  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const urls = (await kv.get<Record<string, string>>(KV_KEY)) ?? {};
  delete urls[name];
  await kv.set(KV_KEY, urls);
  return NextResponse.json({ ok: true });
}
