import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const categorySlug = searchParams.get('category') || '';
    const tagSlug = searchParams.get('tag') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { status: 'PUBLISHED' };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }
    if (tagSlug) {
      where.tags = { some: { tag: { slug: tagSlug } } };
    }

    const [blogs, total, categories] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          readingTime: true,
          createdAt: true,
          category: { select: { id: true, name: true, slug: true } },
          authorProfile: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
      prisma.blogCategory.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { order: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        blogs,
        categories,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error: any) {
    console.error('Mobile Blog API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
