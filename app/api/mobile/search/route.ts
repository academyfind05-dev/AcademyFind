import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { meili } from '@/lib/meilisearch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const city = searchParams.get('city') || '';
    const sort = searchParams.get('sort') || 'rating';
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
    if (city && city !== "ALL") searchFilters.push(`citySlug = "${city}"`);
    if (category && category !== "ALL") searchFilters.push(`categorySlugs = "${category}"`); 
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

    // Sorting
    let sortOptions: string[] = ["planWeight:desc", "googleRating:desc"];
    if (sort === "rating") {
      sortOptions = ["planWeight:desc", "googleRating:desc"];
    } else if (sort === "reviews") {
      sortOptions = ["planWeight:desc", "googleReviewCount:desc"];
    } else if (lat && lng && sort === "nearest_location") {
      sortOptions = ["planWeight:desc", `_geoPoint(${lat}, ${lng}):asc`, "googleRating:desc"];
    } else {
      sortOptions = ["planWeight:desc", "createdAt:desc"]; // fallback
    }

    let searchRes = await meili.index("global_search").search(q, {
      limit: limit,
      offset: offset,
      filter: searchFilters,
      sort: sortOptions,
    });

    let hits = searchRes.hits || [];

    // Fallback if strict search returns nothing, perform direct Prisma query for exact city/category match
    if (hits.length === 0) {
      const dbWhere: any = {
        isActive: true,
        isPublished: true,
      };

      if (city && city !== "ALL") {
        dbWhere.city = { slug: city };
      }

      if (category && category !== "ALL") {
        dbWhere.categories = {
          some: {
            category: {
              slug: { contains: category, mode: 'insensitive' }
            }
          }
        };
      }

      if (q.trim()) {
        dbWhere.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
          { feeInfo: { contains: q, mode: 'insensitive' } }
        ];
      }

      const fallbackDbInstitutes = await prisma.institute.findMany({
        where: dbWhere,
        take: limit,
        skip: offset,
        orderBy: sort === 'rating' ? { googleRating: 'desc' } : { createdAt: 'desc' },
        include: {
          city: { select: { name: true } },
          categories: { select: { category: { select: { name: true } } }, take: 3 }
        }
      });

      if (fallbackDbInstitutes.length > 0) {
        const formattedFallback = fallbackDbInstitutes.map(inst => ({
          ...inst,
          _type: "institute",
          averageRating: inst.googleRating || inst.averageRating || 4.5,
          reviewCount: inst.googleReviewCount || inst.reviewCount || 12,
        }));

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
      include: {
        city: { select: { name: true } },
        categories: { select: { category: { select: { name: true } } }, take: 3 }
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

    const totalHits = searchRes.estimatedTotalHits || 0;

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
