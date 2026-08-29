import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { instituteId } = await params;

    // Last 30 days views
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [dailyViews, totalViews, enquiryStats, reviewStats, shortlistedBy, viewHistory] = await Promise.all([
      prisma.instituteDailyView.findMany({
        where: { instituteId, date: { gte: thirtyDaysAgo } },
        orderBy: { date: 'asc' },
      }),
      prisma.instituteVisit.count({ where: { instituteId } }),
      prisma.instituteEnquiry.groupBy({
        by: ['status'],
        where: { instituteId },
        _count: true,
      }),
      prisma.review.aggregate({
        where: { instituteId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.userShortlist.findMany({
        where: { instituteId },
        include: { user: { select: { name: true, email: true, image: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.userHistory.findMany({
        where: { instituteId },
        include: { user: { select: { name: true, email: true, image: true, username: true } } },
        orderBy: { viewedAt: 'desc' },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        dailyViews,
        totalViews,
        enquiryStats,
        reviewStats: {
          averageRating: reviewStats._avg.rating || 0,
          totalReviews: reviewStats._count.rating,
        },
        shortlistedBy,
        viewHistory,
      },
    });
  } catch (error: any) {
    console.error("Manager Analytics API Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
