import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const city = searchParams.get('city') || '';
    const category = searchParams.get('category') || '';
    const rating = searchParams.get('rating') || '';
    const sort = searchParams.get('sort') || 'reviews';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {
      isActive: true,
      isPublished: true,
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (city) {
      where.city = { slug: city };
    }

    if (category) {
      where.categories = { some: { category: { slug: category } } };
    }

    if (rating) {
      where.averageRating = { gte: parseFloat(rating) };
    }

    const orderBy: any = sort === 'rating' 
      ? [{ planWeight: 'desc' }, { googleRating: 'desc' }, { averageRating: 'desc' }]
      : sort === 'newest' 
      ? [{ planWeight: 'desc' }, { createdAt: 'desc' }]
      : [{ planWeight: 'desc' }, { googleReviewCount: 'desc' }, { reviewCount: 'desc' }];

    const [institutes, total] = await Promise.all([
      prisma.institute.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          gallery: true,
          logo: true,
          imageUrl: true,
          averageRating: true,
          reviewCount: true,
          phone: true,
          providerType: true,
          isVerified: true,
          address: true,
          city: { select: { id: true, name: true, slug: true } },
          categories: {
            select: {
              category: { select: { id: true, name: true, slug: true } }
            },
            take: 3,
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.institute.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        institutes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Mobile Institutes API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
