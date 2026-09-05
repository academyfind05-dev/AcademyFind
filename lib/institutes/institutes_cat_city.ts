import { prisma } from "@/lib/prisma";
import { meili } from "@/lib/meilisearch";
import { Institute, City, Review } from "@/app/generated/prisma/client";

export type InstituteWithDistance = Institute & {
  city: City;
  reviews: Review[];
  distance?: string | null;
};

export async function getInstitutesByCategoryAndCity(
  categorySlug: string,
  citySlug: string,
  sort?: string,
  page: number = 1,
  q?: string,
  lat?: number, 
  lng?: number, 
  radius?: number,    
  minRating?: number, 
  mode?: string,       // 🚀 NAYA ADD KIYA: mode parameter
  providerType?: string,
  limit: number = 12
) {
  const skip = (page - 1) * limit;
  const radiusInMeters = radius ? radius * 1000 : 5000; 

  // 🚀 Parse mode string into array (e.g. "online,hybrid" => ["online", "hybrid"])
  const modesArray = mode ? mode.split(",").map(m => m.trim().toUpperCase()) : [];
  const isHomeTuition = modesArray.includes("HOMETUITION");
  const pureModes = modesArray.filter(m => m !== "HOMETUITION");

  // ==========================================
  // 🚀 SCENARIO 1: MEILISEARCH
  // ==========================================
  if ((q && q.trim() !== "") || (lat && lng)) {
    let exactAreaMatch = true;

    let searchOptions: any = {
      matchingStrategy: 'all',
      filter: [
        `type = "institute"`,
        `isActive = true`, 
        `isPublished = true`,
        `citySlug = "${citySlug}"`,
        `categorySlugs = "${categorySlug}"`
      ],
      limit: limit,
      offset: skip,
    };

    if (minRating) {
      searchOptions.filter.push(`googleRating >= ${minRating}`);
    }

    // 🚀 NEW: Meilisearch Mode Filter using IN operator
    if (pureModes.length > 0 && pureModes.length < 3) {
      const meiliModes = pureModes.map(m => `"${m.toLowerCase()}"`).join(", ");
      searchOptions.filter.push(`mode IN [${meiliModes}]`);
    }

    if (providerType && providerType !== "ALL") {
      searchOptions.filter.push(`providerType = "${providerType}"`);
    }

    if (lat && lng) {
      searchOptions.filter.push(`_geoRadius(${lat}, ${lng}, ${radiusInMeters})`);
    }

    if (sort === "rating") {
      searchOptions.sort = ["planWeight:desc", "googleRating:desc"];
    } else if (sort === "reviews") {
      searchOptions.sort = ["planWeight:desc", "googleReviewCount:desc"];
    } else if (lat && lng) {
      searchOptions.sort = [`_geoPoint(${lat}, ${lng}):asc`, "googleReviewCount:desc", "planWeight:desc", "googleRating:desc"]; 
    } else {
      searchOptions.sort = ["planWeight:desc", "googleRating:desc"];
    }

    let searchQuery = q ? q.trim() : "";
    if (isHomeTuition) {
      searchQuery = searchQuery ? `${searchQuery} home tuition` : "home tuition";
    }

    let searchRes = await meili.index("global_search").search(searchQuery, searchOptions);

    if (searchRes.hits.length === 0) {
      exactAreaMatch = false; 
      
      // Fallback A (Radius hatao, par isActive rakho)
      searchOptions.filter = [
        `type = "institute"`,
        `isActive = true`,
        `isPublished = true`, 
        `citySlug = "${citySlug}"`,
        `categorySlugs = "${categorySlug}"`
      ];
      
      if (minRating) searchOptions.filter.push(`googleRating >= ${minRating}`);
      
      // 🚀 NEW: Fallback Meilisearch Mode Filter
      if (pureModes.length > 0 && pureModes.length < 3) {
        const meiliModes = pureModes.map(m => `"${m.toLowerCase()}"`).join(", ");
        searchOptions.filter.push(`mode IN [${meiliModes}]`);
      }
      
      if (providerType && providerType !== "ALL") {
        searchOptions.filter.push(`providerType = "${providerType}"`);
      }
      
      if (sort === "rating") searchOptions.sort = ["planWeight:desc", "googleRating:desc"];
      else if (sort === "reviews") searchOptions.sort = ["planWeight:desc", "googleReviewCount:desc"];
      else if (lat && lng) searchOptions.sort = [`_geoPoint(${lat}, ${lng}):asc`, "googleReviewCount:desc", "planWeight:desc", "googleRating:desc"];
      else searchOptions.sort = ["planWeight:desc", "googleRating:desc"];

      searchRes = await meili.index("global_search").search(searchQuery, searchOptions);
    }

    const instituteIds = searchRes.hits.map((hit: any) => hit.prismaId);

    if (instituteIds.length === 0) {
      return { institutes: [], totalPages: 0, currentPage: page, totalCount: 0, exactAreaMatch: false };
    }

    const dbInstitutes = await prisma.institute.findMany({
      where: { 
        id: { in: instituteIds },
        isActive: true ,
        isPublished: true,
      },
      include: { city: true, reviews: true },
    });

    const distanceMap = new Map(
      searchRes.hits.map((hit: any) => [
        hit.prismaId, 
        hit._geoDistance ? (hit._geoDistance / 1000).toFixed(1) : null
      ])
    );

    const orderedInstitutes = instituteIds.flatMap((id) => {
      const inst = dbInstitutes.find((i) => i.id === id);
      if (!inst) return [];
      
      return [{
        ...inst,
        distance: distanceMap.get(id) || null
      }];
    });

    return {
      institutes: orderedInstitutes,
      totalPages: Math.ceil((searchRes.estimatedTotalHits || 0) / limit),
      currentPage: page,
      totalCount: searchRes.estimatedTotalHits || 0,
      exactAreaMatch,
    };
  }

  // ==========================================
  // 🏢 SCENARIO 2: PURE PRISMA
  // ==========================================
  let orderBy = {};
  switch (sort) {
    case "rating": orderBy = [{ planWeight: "desc" }, { googleRating: "desc" }, { id: "asc" }]; break;
    case "reviews": orderBy = [{ planWeight: "desc" }, { googleReviewCount: "desc" }, { id: "asc" }]; break;
    default: orderBy = [{ planWeight: "desc" }, { googleRating: "desc" }, { id: "asc" }];
  }

  // Prisma Where Clause
  const prismaWhere: any = {
    isActive: true, 
    isPublished: true,
    city: { slug: citySlug },
    categories: { some: { category: { slug: categorySlug } } },
  };

  if (minRating) {
    prismaWhere.googleRating = { gte: minRating };
  }

  // 🚀 NEW: Prisma Mode Filter using Enum values
  if (pureModes.length > 0 && pureModes.length < 3) {
    prismaWhere.mode = { in: pureModes as any[] };
  }

  if (providerType && providerType !== "ALL") {
    prismaWhere.providerType = providerType;
  }

  if (isHomeTuition) {
    prismaWhere.AND = [
      ...(prismaWhere.AND || []),
      {
        OR: [
          { categories: { some: { category: { slug: 'home-tuition' } } } },
          { name: { contains: 'home tuition', mode: 'insensitive' } },
          { name: { contains: 'hometuition', mode: 'insensitive' } },
          { name: { contains: 'tutor', mode: 'insensitive' } },
        ]
      }
    ];
  }

  const [institutes, totalCount] = await Promise.all([
    prisma.institute.findMany({
      where: prismaWhere,
      include: { city: true, reviews: true },
      orderBy,
      skip: skip,
      take: limit,
    }),
    prisma.institute.count({
      where: prismaWhere,
    }),
  ]);

  return {
    institutes,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    totalCount,
  };
}