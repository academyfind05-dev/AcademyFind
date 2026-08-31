import { NextRequest, NextResponse } from "next/server";
import { meili } from "@/lib/meilisearch";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || searchParams.get("input") || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, predictions: [] });
    }

    const predictions: any[] = [];
    const seen = new Set<string>();

    // ── 1. Meilisearch Area & Institute & City Search ─────────────────────
    try {
      const meiliResult = await meili.index("global_search").search(query, {
        limit: 12,
        attributesToSearchOn: ["name", "address", "city", "state", "cityName"],
      });

      if (meiliResult.hits && meiliResult.hits.length > 0) {
        for (const hit of meiliResult.hits) {
          const lat = hit._geo?.lat || hit.latitude;
          const lng = hit._geo?.lng || hit.longitude;

          if (lat && lng) {
            let mainText = hit.name;
            let secondaryText = [hit.city, hit.state].filter(Boolean).join(", ");

            if (hit.type === "institute" && hit.address) {
              const addressParts = hit.address.split(",").map((s: string) => s.trim()).filter(Boolean);
              mainText = addressParts[0] || hit.name;
              secondaryText = `${hit.name} (${hit.city || ""})`;
            }

            const key = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
            if (!seen.has(key)) {
              seen.add(key);
              predictions.push({
                description: `${mainText}, ${secondaryText || "India"}`,
                place_id: `meili_${hit.id}`,
                lat: Number(lat),
                lng: Number(lng),
                source: "meilisearch",
                type: hit.type || "area",
                structured_formatting: {
                  main_text: mainText,
                  secondary_text: secondaryText || "Indexed Location",
                },
              });
            }
          }
        }
      }
    } catch (meiliErr) {
      console.warn("Meilisearch area search fallback:", meiliErr);
    }

    // ── 2. Google Places / Photon Autocomplete API ─────────────────────────
    try {
      const autocompleteUrl = new URL(
        `/api/mobile/location/autocomplete?input=${encodeURIComponent(query)}`,
        req.url
      );
      const autoRes = await fetch(autocompleteUrl.toString());
      if (autoRes.ok) {
        const autoData = await autoRes.json();
        if (autoData.predictions && Array.isArray(autoData.predictions)) {
          for (const pred of autoData.predictions) {
            const desc = pred.description || pred.structured_formatting?.main_text;
            if (desc && !seen.has(desc.toLowerCase())) {
              seen.add(desc.toLowerCase());
              predictions.push({
                description: desc,
                place_id: pred.place_id,
                lat: pred.lat || null,
                lng: pred.lng || null,
                source: "google_places",
                type: "locality",
                structured_formatting: pred.structured_formatting || {
                  main_text: desc,
                  secondary_text: "Locality / Place",
                },
              });
            }
          }
        }
      }
    } catch (autoErr) {
      console.error("Autocomplete proxy error:", autoErr);
    }

    // ── 3. Database Cities / Institutes Fallback ───────────────────────────
    if (predictions.length < 5) {
      try {
        const dbCities = await prisma.city.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { state: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 5,
        });

        for (const city of dbCities) {
          const key = `city_${city.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            predictions.push({
              description: `${city.name}, ${city.state || "India"}`,
              place_id: key,
              lat: city.latitude || 28.6139,
              lng: city.longitude || 77.2090,
              source: "database",
              type: "city",
              structured_formatting: {
                main_text: city.name,
                secondary_text: `${city.state || "India"}`,
              },
            });
          }
        }
      } catch (dbErr) {
        console.error("DB city fallback error:", dbErr);
      }
    }

    return NextResponse.json({ success: true, predictions });
  } catch (error: any) {
    console.error("Error in admin area search:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to search area" }, { status: 500 });
  }
}
