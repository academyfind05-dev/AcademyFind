import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { meili } from '@/lib/meilisearch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const city = searchParams.get('city') || '';
    const sort = searchParams.get('sort') || 'reviews';
    const ratingStr = searchParams.get('rating');
    const modeStr = searchParams.get('mode');
    
    // Naye Filters
    const type = searchParams.get('type') || 'ALL';
    const providerType = searchParams.get('providerType') || 'ALL';
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '5';
    
    // pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const offset = (page - 1) * limit;

    const searchFilters: string[] = [];

    // Apply exact parity filters
    if (type && type !== "ALL") searchFilters.push(`type = "${type}"`);
    if (city && city !== "ALL") {
      const cleanCity = city.toLowerCase().trim();
      searchFilters.push(`(citySlug = "${cleanCity}" OR citySlug = "${city}" OR cityName = "${city}")`);
    }
    if (category && category !== "ALL") {
      const cleanCat = category.toLowerCase().trim();
      searchFilters.push(`(categorySlugs = "${cleanCat}" OR categorySlugs = "${category}")`);
    }
    if (ratingStr && ratingStr !== "all") searchFilters.push(`googleRating >= ${ratingStr}`);
    if (providerType && providerType !== "ALL") searchFilters.push(`providerType = "${providerType}"`);

    if (modeStr) {
      const modes = modeStr.split(',').map((m: string) => `"${m.trim().toLowerCase()}"`);
      if (modes.length > 0 && modes.length < 3) {
        searchFilters.push(`mode IN [${modes.join(", ")}]`);
      }
    }

    // Geo-Radius
    if (lat && lng && radius !== "ALL") {
      const radiusInMeters = parseInt(radius) * 1000;
      searchFilters.push(`_geoRadius(${lat}, ${lng}, ${radiusInMeters})`);
    }

    // Sorting: Always prioritize Tier (planWeight: Ultra -> Premium -> Verified -> Basic)
    // By default within tier, sort by Number of Reviews (googleReviewCount)
    let sortOptions: string[] = ["planWeight:desc", "googleReviewCount:desc"];
    if (sort === "rating") {
      sortOptions = ["planWeight:desc", "googleRating:desc"];
    } else if (sort === "reviews") {
      sortOptions = ["planWeight:desc", "googleReviewCount:desc"];
    } else if (sort === "newest") {
      sortOptions = ["planWeight:desc", "createdAt:desc"];
    } else if (lat && lng && (sort === "nearest_location" || sort === "nearest_me")) {
      sortOptions = ["planWeight:desc", `_geoPoint(${lat}, ${lng}):asc`, "googleReviewCount:desc"];
    } else {
      sortOptions = ["planWeight:desc", "googleReviewCount:desc"];
    }

    // If q is only matching the category slug/title, don't restrict fulltext keyword search
    const isCategoryOnly = category && q && (
      q.toLowerCase() === category.toLowerCase() ||
      q.toLowerCase().replace(/\s+/g, '-') === category.toLowerCase() ||
      category.toLowerCase().includes(q.toLowerCase().replace(/\s+coaching/i, ''))
    );
    const meiliQuery = isCategoryOnly ? '' : q;

    let hits: any[] = [];
    let estimatedTotal = 0;
    try {
      const searchRes = await meili.index("global_search").search(meiliQuery, {
        limit: limit,
        offset: offset,
        filter: searchFilters,
        sort: sortOptions,
      });
      hits = searchRes.hits || [];
      estimatedTotal = searchRes.estimatedTotalHits || hits.length;
    } catch (mErr) {
      console.warn("Meilisearch search error, using DB fallback:", mErr);
    }

    // Fallback if strict search returns nothing, perform direct Prisma query for exact city/category match
    if (hits.length === 0) {
      const dbWhere: any = {
        isActive: true,
        isPublished: true,
      };

      if (city && city !== "ALL") {
        const cleanCity = city.toLowerCase().trim();
        dbWhere.OR = [
          { city: { slug: { equals: cleanCity, mode: 'insensitive' } } },
          { city: { name: { equals: city.trim(), mode: 'insensitive' } } },
          { city: { slug: { contains: cleanCity, mode: 'insensitive' } } },
          { address: { contains: city.trim(), mode: 'insensitive' } }
        ];
      }

      if (category && category !== "ALL") {
        const cleanCat = category.toLowerCase().replace(/\s+/g, '-');
        dbWhere.categories = {
          some: {
            category: {
              OR: [
                { slug: { contains: cleanCat, mode: 'insensitive' } },
                { slug: { contains: category, mode: 'insensitive' } },
                { name: { contains: category, mode: 'insensitive' } }
              ]
            }
          }
        };
      }

      if (ratingStr && ratingStr !== "all") {
        dbWhere.AND = [
          ...(dbWhere.AND || []),
          {
            OR: [
              { googleRating: { gte: parseFloat(ratingStr) } },
              { averageRating: { gte: parseFloat(ratingStr) } }
            ]
          }
        ];
      }

      if (providerType && providerType !== "ALL") {
        dbWhere.providerType = providerType;
      }

      if (modeStr) {
        const modes = modeStr.split(',').map((m: string) => m.trim().toUpperCase());
        dbWhere.mode = { in: modes };
      }

      if (q.trim() && !isCategoryOnly) {
        dbWhere.AND = [
          ...(dbWhere.AND || []),
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { address: { contains: q, mode: 'insensitive' } },
              { feeInfo: { contains: q, mode: 'insensitive' } }
            ]
          }
        ];
      }

      const fallbackDbInstitutes = await prisma.institute.findMany({
        where: dbWhere,
        take: limit,
        skip: offset,
        orderBy: sort === 'rating'
          ? [{ planWeight: 'desc' }, { googleRating: 'desc' }]
          : sort === 'newest'
          ? [{ planWeight: 'desc' }, { createdAt: 'desc' }]
          : [{ planWeight: 'desc' }, { googleReviewCount: 'desc' }, { reviewCount: 'desc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          coverImage: true,
          imageUrl: true,
          gallery: true,
          address: true,
          mode: true,
          latitude: true,
          longitude: true,
          averageRating: true,
          googleRating: true,
          reviewCount: true,
          googleReviewCount: true,
          subscriptionPlan: true,
          isVerified: true,
          providerType: true,
          planWeight: true,
          createdAt: true,
          city: { select: { name: true } },
          categories: { select: { category: { select: { name: true, slug: true } } }, take: 3 }
        }
      });

      if (fallbackDbInstitutes.length > 0) {
        const userLatNum = lat ? parseFloat(lat) : null;
        const userLngNum = lng ? parseFloat(lng) : null;

        const formattedFallback = fallbackDbInstitutes.map(inst => {
          let distance: string | null = null;
          if (userLatNum && userLngNum && inst.latitude && inst.longitude) {
            const radlat1 = (Math.PI * userLatNum) / 180;
            const radlat2 = (Math.PI * inst.latitude) / 180;
            const theta = userLngNum - inst.longitude;
            const radtheta = (Math.PI * theta) / 180;
            let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) dist = 1;
            dist = Math.acos(dist);
            dist = (dist * 180) / Math.PI;
            dist = dist * 60 * 1.1515 * 1.609344; // Convert to KM
            distance = dist.toFixed(1);
          }

          return {
            ...inst,
            _type: "institute",
            distance,
            averageRating: inst.googleRating || inst.averageRating || 4.5,
            reviewCount: inst.googleReviewCount || inst.reviewCount || 12,
          };
        });

        return NextResponse.json({
          success: true,
          data: {
            results: formattedFallback,
            pagination: {
              total: fallbackDbInstitutes.length,
              page,
              limit,
              totalPages: 1
            }
          }
        });
      }
    }

    // Fetch institutes from Prisma to get nested relations
    const instituteIds = hits.filter((h: any) => h.type === "institute").map((h: any) => h.prismaId);
    
    const dbInstitutes = await prisma.institute.findMany({
      where: { 
        id: { in: instituteIds },
        isActive: true,
        isPublished: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        coverImage: true,
        imageUrl: true,
        gallery: true,
        address: true,
        mode: true,
        latitude: true,
        longitude: true,
        averageRating: true,
        googleRating: true,
        reviewCount: true,
        googleReviewCount: true,
        subscriptionPlan: true,
        isVerified: true,
        providerType: true,
        planWeight: true,
        createdAt: true,
        city: { select: { name: true } },
        categories: { select: { category: { select: { name: true, slug: true } } }, take: 3 }
      }
    });

    const orderedInstitutes = instituteIds.flatMap((id: string) => {
      const inst = dbInstitutes.find((i: any) => i.id === id);
      const hit = hits.find((h: any) => h.prismaId === id);
      if (!inst) return [];
      
      return [{
        ...inst,
        _type: "institute",
        distance: hit?._geoDistance ? (hit._geoDistance / 1000).toFixed(1) : null,
        averageRating: hit?.googleRating || inst.averageRating,
        reviewCount: hit?.googleReviewCount || inst.reviewCount,
      }];
    });

    // For Jobs and Blogs, we just return the Meilisearch hits directly
    const jobs = hits.filter((h: any) => h.type === "job").map((h: any) => ({
       ...h,
       _type: "job"
    }));

    const blogs = hits.filter((h: any) => h.type === "blog").map((h: any) => ({
       ...h,
       _type: "blog"
    }));

    const totalHits = estimatedTotal || orderedInstitutes.length || 0;

    return NextResponse.json({ 
      success: true, 
      data: {
        // Return a unified array so the FlatList can render mixed content
        results: [...orderedInstitutes, ...jobs, ...blogs],
        pagination: {
          total: totalHits,
          page,
          limit,
          totalPages: Math.ceil(totalHits / limit)
        }
      }
    });

  } catch (error: any) {
    console.error("Mobile Search API Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
