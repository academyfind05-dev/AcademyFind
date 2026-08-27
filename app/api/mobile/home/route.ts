import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch Active Advertisements
    const activeAds = await prisma.advertisement.findMany({
      where: {
        status: 'APPROVED' as any,
        visibility: 'VISIBLE' as any,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Fetch Real Featured & Top Rated Institutes
    const featuredInstitutes = await prisma.institute.findMany({
      where: {
        isActive: true,
        isPublished: true,
        OR: [
          { isFeatured: true },
          { subscriptionPlan: { in: ['ULTRA', 'PREMIUM', 'VERIFIED'] } },
          { googleRating: { gte: 4.0 } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        coverImage: true,
        averageRating: true,
        googleRating: true,
        reviewCount: true,
        googleReviewCount: true,
        subscriptionPlan: true,
        isVerified: true,
        city: { select: { name: true } },
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          },
          take: 2
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { planWeight: 'desc' },
        { googleRating: 'desc' },
        { googleReviewCount: 'desc' },
        { reviewCount: 'desc' }
      ],
      take: 6
    });

    // Fetch Popular Comparisons
    const popularComparisons = await prisma.instituteComparisonCache.findMany({
      orderBy: { viewCount: 'desc' },
      take: 5,
      include: {
        institute1: { select: { name: true, logo: true, slug: true, city: { select: { name: true } } } },
        institute2: { select: { name: true, logo: true, slug: true } },
      },
    });

    // Fetch Global Stats for HeroCards
    const categoryCount = await prisma.category.count({ where: { isActive: true } });
    const cityCount = await prisma.city.count({ where: { institutes: { some: { isActive: true } } } });

    const stats = await prisma.institute.aggregate({
      where: { isActive: true },
      _count: { id: true },
      _avg: { googleRating: true },
    });
    
    const instituteCount = stats._count.id;
    const avgRating = stats._avg.googleRating || 0;

    return NextResponse.json({
      success: true,
      data: {
        activeAds,
        featuredInstitutes,
        popularComparisons,
        globalStats: {
          categories: categoryCount,
          cities: cityCount,
          institutes: instituteCount,
          avgRating: avgRating
        }
      }
    });
  } catch (error) {
    console.error('Mobile Home API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
