import { NextResponse } from "next/server";
import { meili } from "@/lib/meilisearch";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const result = await meili
      .index("global_search")
      .search(q, {
        limit: 20, // fetch more to sort locally
        attributesToHighlight: ["name"],
      });

    const sortedHits = result.hits.sort((a, b) => {
      const typeRank: Record<string, number> = { category: 1, city: 2, institute: 3 };
      const rankA = typeRank[a.type] || 4;
      const rankB = typeRank[b.type] || 4;
      
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return 0;
    });

    return NextResponse.json({ success: true, data: sortedHits.slice(0, 8) });
  } catch (error) {
    console.error("MeiliSearch Error in mobile suggestions API:", error);
    return NextResponse.json({ success: true, data: [] });
  }
}
