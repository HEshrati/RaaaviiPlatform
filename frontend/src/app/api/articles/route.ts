import { NextResponse } from "next/server";
import { ARTICLES } from "@/lib/articles-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const category = searchParams.get("category");

  let result = [...ARTICLES].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  if (category && category !== "همه") {
    result = result.filter(a => a.category === category);
  }

  return NextResponse.json(result.slice(0, limit));
}
