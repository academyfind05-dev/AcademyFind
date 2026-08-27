import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slugsParam = searchParams.get('slugs');

    if (!slugsParam) {
      return NextResponse.json({ success: false, error: 'slugs parameter is required' }, { status: 400 });
    }

    const identifiers = slugsParam.split(',').map(s => s.trim()).filter(Boolean);

    if (identifiers.length < 2) {
      return NextResponse.json({ success: false, error: 'At least 2 institutes are required to compare' }, { status: 400 });
    }

    // Find institutes matching either slug or id
    const institutes = await prisma.institute.findMany({
      where: {
        OR: [
          { slug: { in: identifiers } },
          { id: { in: identifiers } }
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        imageUrl: true,
        coverImage: true,
        address: true,
        averageRating: true,
        googleRating: true,
        reviewCount: true,
        googleReviewCount: true,
        isVerified: true,
        providerType: true,
        mode: true,
        city: { select: { name: true, slug: true } },
        categories: { select: { category: { select: { name: true, slug: true } } } },
        _count: { select: { memberships: true, reviews: true } }
      }
    });

    // Map results in order of requested identifiers
    const result = identifiers.map(idOrSlug => {
      const match = institutes.find(i => i.slug === idOrSlug || i.id === idOrSlug);
      if (!match) return null;

      return {
        ...match,
        averageRating: match.googleRating || match.averageRating || 4.5,
        reviewCount: match.googleReviewCount || match.reviewCount || 0,
      };
    }).filter(Boolean);

    if (result.length < 2) {
      // Fallback: If exact slug match failed for one, try insensitive search
      const fallbackInstitutes = await prisma.institute.findMany({
        where: {
          OR: identifiers.map(idOrSlug => ({
            name: { contains: idOrSlug, mode: 'insensitive' }
          })),
          isActive: true,
        },
        take: 2,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          imageUrl: true,
          coverImage: true,
          address: true,
          averageRating: true,
          googleRating: true,
          reviewCount: true,
          googleReviewCount: true,
          isVerified: true,
          providerType: true,
          mode: true,
          city: { select: { name: true, slug: true } },
          categories: { select: { category: { select: { name: true, slug: true } } } },
          _count: { select: { memberships: true, reviews: true } }
        }
      });

      if (fallbackInstitutes.length >= 2) {
        const formattedFallback = fallbackInstitutes.map(match => ({
          ...match,
          averageRating: match.googleRating || match.averageRating || 4.5,
          reviewCount: match.googleReviewCount || match.reviewCount || 0,
        }));
        return NextResponse.json({ success: true, data: formattedFallback });
      }

      return NextResponse.json({ success: false, error: 'One or both institutes could not be found for comparison' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Mobile Compare API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
