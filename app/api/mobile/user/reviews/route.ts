import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMobileUserId } from '@/lib/auth/getMobileUserId';

export async function GET(request: NextRequest) {
  try {
    const userId = await getMobileUserId(request);
    if (!userId) {
      return NextResponse.json({ success: true, data: { reviews: [], total: 0 } });
    }

    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            imageUrl: true,
            averageRating: true,
            reviewCount: true,
            city: { select: { name: true } },
          },
        },
        replies: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        total: reviews.length,
      },
    });
  } catch (error: any) {
    console.error('User Reviews Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getMobileUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');
    if (!reviewId) {
      return NextResponse.json({ success: false, error: 'Review ID is required' }, { status: 400 });
    }

    const review = await prisma.review.findFirst({
      where: { id: reviewId, userId },
    });

    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found or unauthorized' }, { status: 404 });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    console.error('Delete Review Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
