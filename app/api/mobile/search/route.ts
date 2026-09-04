import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { meili } from '@/lib/meilisearch';

function calcDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const city = searchParams.get('city') || '';
    const address = searchParams.get('address') || '';
    const sort = searchParams.get('sort') || 'reviews';
    const ratingStr = searchParams.get('rating');
    const modeStr = searchParams.get('mode');
    
    // Naye Filters
    const type = searchParams.get('type') || 'ALL';
    const providerType = searchParams.get('providerType') || 'ALL';
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || null;

    // Auto-detect city from address if city is not explicitly passed
    let effectiveCity = city;
    if ((!effectiveCity || effectiveCity === 'ALL') && address) {
      const lowerAddr = address.toLowerCase();
      for (const [key, slug] of [
        ['greater noida', 'greater-noida'],
        ['noida', 'noida'],
        ['delhi', 'delhi'],
        ['new delhi', 'delhi'],
        ['gurugram', 'gurugram'],
        ['gurgaon', 'gurugram'],
        ['faridabad', 'faridabad'],
        ['ghaziabad', 'ghaziabad'],
        ['meerut', 'meerut'],
        ['sonipat', 'sonipat'],
        ['modinagar', 'modinagar'],
        ['kota', 'kota'],
        ['jaipur', 'jaipur'],
        ['lucknow', 'lucknow'],
        ['kanpur', 'kanpur'],
        ['agra', 'agra'],
        ['varanasi', 'varanasi'],
        ['prayagraj', 'prayagraj'],
        ['patna', 'patna'],
        ['ranchi', 'ranchi'],
        ['bhopal', 'bhopal'],
        ['indore', 'indore'],
        ['chandigarh', 'chandigarh'],
        ['mohali', 'chandigarh'],
        ['dehradun', 'dehradun'],
        ['mumbai', 'mumbai'],
        ['pune', 'pune'],
        ['bangalore', 'bangalore'],
        ['bengaluru', 'bangalore'],
        ['hyderabad', 'hyderabad'],
        ['chennai', 'chennai'],
        ['kolkata', 'kolkata'],
        ['ahmedabad', 'ahmedabad'],
        ['surat', 'surat'],
        ['vadodara', 'vadodara'],
        ['nagpur', 'nagpur'],
      ] as const) {
        if (lowerAddr.includes(key)) {
          effectiveCity = slug;
          break;
        }
      }
    }
    
    // pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const offset = (page - 1) * limit;

    const searchFilters: string[] = [];

    // Apply exact parity filters
    if (type && type !== "ALL") searchFilters.push(`type = "${type}"`);
    if (effectiveCity && effectiveCity !== "ALL") {
      const cleanCity = effectiveCity.toLowerCase().trim();
      searchFilters.push(`(citySlug = "${cleanCity}" OR citySlug = "${effectiveCity}" OR cityName = "${effectiveCity}")`);
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

    const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
      'meerut': { lat: 28.9844618, lng: 77.7064137 },
      'noida': { lat: 28.5355161, lng: 77.3910265 },
      'greater-noida': { lat: 28.4743879, lng: 77.5039904 },
      'delhi': { lat: 28.7040592, lng: 77.1024902 },
      'gurugram': { lat: 28.4594965, lng: 77.0266383 },
      'faridabad': { lat: 28.4089123, lng: 77.3177894 },
      'ghaziabad': { lat: 28.6691565, lng: 77.4537578 },
      'modinagar': { lat: 28.8344396, lng: 77.5698527 },
      'sonipat': { lat: 28.9930823, lng: 77.0150735 },
      'kota': { lat: 25.1825442, lng: 75.8288424 },
      'jaipur': { lat: 26.9124336, lng: 75.7872709 },
      'lucknow': { lat: 26.8467088, lng: 80.9461592 },
      'kanpur': { lat: 26.449923, lng: 80.331874 },
      'agra': { lat: 27.1766701, lng: 78.0080745 },
      'varanasi': { lat: 25.3176452, lng: 82.9739144 },
      'prayagraj': { lat: 25.4358011, lng: 81.846311 },
      'patna': { lat: 25.5940947, lng: 85.1375645 },
      'ranchi': { lat: 23.3440997, lng: 85.309562 },
      'bhopal': { lat: 23.2599333, lng: 77.412615 },
      'indore': { lat: 22.7195687, lng: 75.8577258 },
      'chandigarh': { lat: 30.7333148, lng: 76.7794179 },
      'dehradun': { lat: 30.3164945, lng: 78.0321918 },
      'mumbai': { lat: 19.0759837, lng: 72.8776559 },
      'pune': { lat: 18.5204303, lng: 73.8567437 },
      'bangalore': { lat: 12.9715987, lng: 77.5945627 },
      'hyderabad': { lat: 17.385044, lng: 78.486671 },
      'chennai': { lat: 13.0826802, lng: 80.2707184 },
      'kolkata': { lat: 22.572646, lng: 88.363895 },
      'ahmedabad': { lat: 23.022505, lng: 72.5713621 },
      'surat': { lat: 21.1702401, lng: 72.8310607 },
      'vadodara': { lat: 22.3071588, lng: 73.1812187 },
      'nagpur': { lat: 21.1458004, lng: 79.0881546 },
    };

    const effectiveLat = (lat && lat !== '0') ? lat : (effectiveCity && CITY_COORDINATES[effectiveCity] ? String(CITY_COORDINATES[effectiveCity].lat) : null);
    const effectiveLng = (lng && lng !== '0') ? lng : (effectiveCity && CITY_COORDINATES[effectiveCity] ? String(CITY_COORDINATES[effectiveCity].lng) : null);

    // Sorting and geo active coords:
    const activeLat = lat || effectiveLat;
    const activeLng = lng || effectiveLng;

    const isGeoRadiusActive = !!(activeLat && activeLng && radius && radius !== "ALL");

    // Geo-Radius (only when explicitly requested with radius filter and coordinates)
    if (isGeoRadiusActive && activeLat && activeLng) {
      const radiusInMeters = parseInt(radius) * 1000;
      searchFilters.push(`_geoRadius(${activeLat}, ${activeLng}, ${radiusInMeters})`);
    }

    let sortOptions: string[] = ["planWeight:desc", "googleReviewCount:desc"];
    if (activeLat && activeLng) {
      sortOptions = [`_geoPoint(${activeLat}, ${activeLng}):asc`, "googleReviewCount:desc", "planWeight:desc", "googleRating:desc"];
    } else if (sort === "rating") {
      sortOptions = ["planWeight:desc", "googleRating:desc"];
    } else if (sort === "reviews") {
      sortOptions = ["planWeight:desc", "googleReviewCount:desc"];
    } else if (sort === "newest") {
      sortOptions = ["planWeight:desc", "createdAt:desc"];
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

    // Retry with empty query if keyword search was too strict, but KEEP geo-radius filters
    if (hits.length === 0 && meiliQuery.trim().length > 0) {
      try {
        const retryRes = await meili.index("global_search").search("", {
          limit: limit,
          offset: offset,
          filter: searchFilters,
          sort: sortOptions,
        });
        hits = retryRes.hits || [];
        estimatedTotal = retryRes.estimatedTotalHits || hits.length;
      } catch (err) {
        // ignore
      }
    }

    // ✅ CRITICAL: If a geo-radius was active and no institutes exist within that radius in Meilisearch
    // and sort is nearest, never fall back to distant institutes.
    if (hits.length === 0 && isGeoRadiusActive && (sort === 'nearest_location' || sort === 'nearest_me')) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          }
        }
      });
    }

    // Fallback if strict search returns nothing, perform direct Prisma query for exact city/category match
    if (hits.length === 0) {
      const dbWhere: any = {
        isActive: true,
        isPublished: true,
      };

      if (effectiveCity && effectiveCity !== "ALL") {
        const cleanCity = effectiveCity.toLowerCase().trim();
        dbWhere.OR = [
          { city: { slug: { equals: cleanCity, mode: 'insensitive' } } },
          { city: { name: { equals: effectiveCity.trim(), mode: 'insensitive' } } },
          { city: { slug: { contains: cleanCity, mode: 'insensitive' } } },
          { address: { contains: effectiveCity.trim(), mode: 'insensitive' } }
        ];
      } else if (address && address.trim()) {
        const cleanAddr = address.trim();
        const firstAddrPart = cleanAddr.split(',')[0].trim();
        dbWhere.OR = [
          { address: { contains: firstAddrPart, mode: 'insensitive' } },
          { address: { contains: cleanAddr, mode: 'insensitive' } }
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
        take: isGeoRadiusActive ? 100 : limit,
        skip: isGeoRadiusActive ? 0 : offset,
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
        const userLatNum = activeLat ? parseFloat(activeLat) : null;
        const userLngNum = activeLng ? parseFloat(activeLng) : null;

        let formattedFallback = fallbackDbInstitutes.map(inst => {
          let distance: string | null = null;
          if (userLatNum && userLngNum && inst.latitude && inst.longitude) {
            distance = calcDistanceKm(userLatNum, userLngNum, Number(inst.latitude), Number(inst.longitude)).toFixed(1);
          }

          return {
            ...inst,
            _type: "institute",
            distance,
            averageRating: inst.googleRating || inst.averageRating || 4.5,
            reviewCount: inst.googleReviewCount || inst.reviewCount || 12,
          };
        });

        if (isGeoRadiusActive && radius) {
          const maxRadius = parseFloat(radius);
          formattedFallback = formattedFallback.filter(inst => inst.distance !== null && parseFloat(inst.distance) <= maxRadius);
        }

        if (userLatNum && userLngNum) {
          formattedFallback.sort((a, b) => {
            const distA = a.distance !== null ? parseFloat(a.distance) : 999999;
            const distB = b.distance !== null ? parseFloat(b.distance) : 999999;
            if (Math.abs(distA - distB) > 0.05) {
              return distA - distB; // Ascending by distance
            }
            // Tie-breaker: Most reviewed
            const revA = a.googleReviewCount || a.reviewCount || 0;
            const revB = b.googleReviewCount || b.reviewCount || 0;
            if (revB !== revA) return revB - revA;
            const planA = a.planWeight || 0;
            const planB = b.planWeight || 0;
            if (planB !== planA) return planB - planA;
            return (b.averageRating || 0) - (a.averageRating || 0);
          });
        }

        const paginatedFallback = isGeoRadiusActive ? formattedFallback.slice(offset, offset + limit) : formattedFallback;

        return NextResponse.json({
          success: true,
          data: {
            results: paginatedFallback,
            pagination: {
              total: formattedFallback.length,
              page,
              limit,
              totalPages: Math.ceil(formattedFallback.length / limit)
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

    let orderedInstitutes = instituteIds.flatMap((id: string) => {
      const inst = dbInstitutes.find((i: any) => i.id === id);
      const hit = hits.find((h: any) => h.prismaId === id);
      if (!inst) return [];
      
      let distanceKm: string | null = null;
      if (hit?._geoDistance !== undefined && hit?._geoDistance !== null) {
        distanceKm = (hit._geoDistance / 1000).toFixed(1);
      } else if (activeLat && activeLng) {
        const iLat = inst.latitude ? Number(inst.latitude) : (hit?._geo?.lat ? Number(hit._geo.lat) : null);
        const iLng = inst.longitude ? Number(inst.longitude) : (hit?._geo?.lng ? Number(hit._geo.lng) : null);
        if (iLat && iLng) {
          distanceKm = calcDistanceKm(Number(activeLat), Number(activeLng), iLat, iLng).toFixed(1);
        }
      }

      return [{
        ...inst,
        _type: "institute",
        distance: distanceKm,
        averageRating: hit?.googleRating || inst.averageRating,
        reviewCount: hit?.googleReviewCount || inst.reviewCount,
      }];
    });

    // Strict radius filter for institutes returned from Meilisearch
    if (isGeoRadiusActive && radius) {
      const maxRadius = parseFloat(radius);
      orderedInstitutes = orderedInstitutes.filter((inst: any) => {
        return inst.distance !== null && inst.distance !== undefined && parseFloat(inst.distance) <= maxRadius;
      });
    }

    // ✅ If coordinates are active, ALWAYS sort by distance ascending and tie-breaker: most reviewed
    if (activeLat && activeLng) {
      orderedInstitutes.sort((a: any, b: any) => {
        const distA = a.distance !== null && a.distance !== undefined ? parseFloat(a.distance) : 999999;
        const distB = b.distance !== null && b.distance !== undefined ? parseFloat(b.distance) : 999999;
        if (Math.abs(distA - distB) > 0.05) {
          return distA - distB; // Ascending by distance
        }
        // Tie-breaker: Most reviewed
        const revA = a.googleReviewCount || a.reviewCount || 0;
        const revB = b.googleReviewCount || b.reviewCount || 0;
        if (revB !== revA) return revB - revA;
        const planA = a.planWeight || 0;
        const planB = b.planWeight || 0;
        if (planB !== planA) return planB - planA;
        return (b.averageRating || 0) - (a.averageRating || 0);
      });
    }

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
