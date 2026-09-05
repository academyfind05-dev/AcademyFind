import InstituteCard from "@/components/institutes/InstituteCard";
import { meili } from "@/lib/meilisearch";
import MapToggleSection from "../maps/MapToggleSection";
import Link from "next/link";
import { Briefcase, ChevronLeft, ChevronRight, FileText } from "lucide-react";

type Props = {
  query: string;
  type?: string;
  city?: string;
  category?: string;
  rating?: string;
  lat?: string;
  lng?: string;
  radius?: string;
  sort?: string;
  page?: string;
  address?: string;
  userlat?: string; // 👈 Make sure URL aur SearchPage se yahi exact spelling (lowercase ya camelCase) aa rahi ho
  userlng?: string;
  providerType?: string;
};

export default async function InstituteResults({
  query, type, city, category, rating, lat, lng, radius, sort, page, address, userlat, userlng, providerType
}: Props) {

  const searchFilters: string[] = [];

  const pageNumber = page ? parseInt(page) : 1;
  const limit = 20; // Pagination limit
  const offset = (pageNumber - 1) * limit;

  // 2. Text/Standard Filters
  if (type && type !== "ALL") searchFilters.push(`type = "${type}"`);
  if (city && city !== "ALL") searchFilters.push(`citySlug = "${city}"`);
  if (category && category !== "ALL") searchFilters.push(`categorySlugs = "${category}"`);
  if (rating && rating !== "ALL") searchFilters.push(`googleRating >= ${rating}`);
  if (providerType && providerType !== "ALL") searchFilters.push(`providerType = "${providerType}"`);

  // 🔥 DEFAULT SORT HANDLING
  // Agar URL me sort nahi hai, toh by default "rating" maano
  const activeSort = sort || "rating";

  // 🔥 ACTIVE LOCATION DECISION
  const isNearestme = activeSort === "nearest_me" && userlat && userlng;
  const activelat = isNearestme ? userlat : lat;
  const activelng = isNearestme ? userlng : lng;

  // 3. GEO-RADIUS FILTER
  if (activelat && activelng && radius && radius !== "ALL") {
    const radiusInMeters = parseInt(radius) * 1000;
    searchFilters.push(`_geoRadius(${activelat}, ${activelng}, ${radiusInMeters})`);
  } else if (isNearestme && radius !== "ALL") {
    const radiusInMeters = parseInt(radius || "5") * 1000;
    searchFilters.push(`_geoRadius(${activelat}, ${activelng}, ${radiusInMeters})`);
  }

  // 4. SORTING OPTIONS
  let sortOptions: string[] | undefined = undefined;

  if (activelat && activelng) {
    sortOptions = [`_geoPoint(${activelat}, ${activelng}):asc`, "planWeight:desc", "googleReviewCount:desc", "googleRating:desc"];
  } else if (activeSort === "rating") {
    sortOptions = ["planWeight:desc", "googleRating:desc"];
  } else if (activeSort === "reviews") {
    sortOptions = ["planWeight:desc", "googleReviewCount:desc"];
  } else {
    sortOptions = ["planWeight:desc", "googleRating:desc"];
  }

  // SEARCH CALL
  let result = await meili.index("global_search").search(query, {
    limit: limit,
    offset: offset,
    filter: searchFilters,
    sort: sortOptions,
  });

  let hits = result.hits as any[];
  let showedFallbackMessage = false;

  // FALLBACK LOGIC
  if (hits.length === 0 && query.trim().length > 0) {
    showedFallbackMessage = true;
    result = await meili.index("global_search").search("", {
      limit: limit,
      offset: offset,
      filter: searchFilters,
      sort: sortOptions,
    });
    hits = result.hits as any[];
  }

  // PAGINATION VARIABLES
  const totalHits = result.estimatedTotalHits || 0;
  const totalPages = Math.ceil(totalHits / limit);
  const hasPrevPage = pageNumber > 1;
  const hasNextPage = pageNumber < totalPages;

  // 🔥 BUG FIX: Pagination URL mein purane variables ko as-it-is rakhna hai
  const createPageUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    if (rating) params.set("rating", rating);
    if (providerType) params.set("providerType", providerType);

    // Original lat/lng apni jagah
    if (lat) params.set("lat", lat);
    if (lng) params.set("lng", lng);

    // User GPS apni jagah
    if (userlat) params.set("userlat", userlat);
    if (userlng) params.set("userlng", userlng);

    if (radius) params.set("radius", radius);
    if (sort) params.set("sort", sort);
    if (address) params.set("address", address);
    params.set("page", newPage.toString());

    return `/search?${params.toString()}`;
  };

  if (hits.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm mt-4">
        <h3 className="text-lg font-semibold">No results found according to your filters or search query</h3>
        <p className="mt-2 text-slate-500">
          Try expanding your distance radius, searching in a different location or using a different keyword to find more results.
        </p>
        <p className="mt-2 text-slate-500">
          You can also <a href="/contact" className="text-amber-400 font-semibold underline"> contact us</a> to suggest an institute or report missing information.
        </p>
      </div>
    );
  }

  const instituteHits = hits.filter(hit => hit.type === "institute");

  return (
    <>
      {showedFallbackMessage && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm animate-in fade-in zoom-in duration-300">
          <div className="flex items-start gap-3">
            <span className="text-xl">📍</span>
            <div>
              <h4 className="font-semibold">Couldn't find exact matches for your keyword.</h4>
              <p className="text-sm mt-1 text-amber-500">
                Showing top available institutes near your selected location.
              </p>
            </div>
          </div>
        </div>
      )}

      {instituteHits.length > 0 && (
        <MapToggleSection
          institutes={instituteHits.map((institute) => ({
            id: institute.id,
            name: institute.name,
            latitude: institute.latitude || institute._geo?.lat,
            longitude: institute.longitude || institute._geo?.lng,
            slug: `${institute.prismaId}-${institute.slug}`,
          }))}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        {hits.map((hit) => {
          // 🔥 Ab agar sortOptions Meili ko jayega, tabhi _geoDistance aayega
          const distanceInKm = hit._geoDistance
            ? (hit._geoDistance / 1000).toFixed(1) + " km"
            : undefined;

          if (hit.type === "institute") {
            return (
              <InstituteCard
                key={hit.id}
                id={hit.prismaId}
                slug={hit.slug}
                name={hit.name}
                image={hit.imageUrl}
                averageRating={hit.googleRating || hit.averageRating}
                reviewCount={hit.googleReviewCount || hit.reviewCount}
                description={hit.description}
                city={{
                  name: hit.city,
                  slug: hit.citySlug,
                }}
                distance={distanceInKm}
              />
            );
          }
          // ... (Job and category components) ...
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 mt-10 pt-6">
          <Link
            href={hasPrevPage ? createPageUrl(pageNumber - 1) : "#"}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${hasPrevPage ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" : "opacity-50 cursor-not-allowed text-slate-400"}`}
            aria-disabled={!hasPrevPage}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Link>

          <span className="text-sm font-medium text-slate-500">
            Page {pageNumber} of {totalPages}
          </span>

          <Link
            href={hasNextPage ? createPageUrl(pageNumber + 1) : "#"}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${hasNextPage ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" : "opacity-50 cursor-not-allowed text-slate-400"}`}
            aria-disabled={!hasNextPage}
          >
            Next <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </>
  );
}