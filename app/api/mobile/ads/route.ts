import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const activeAds = await prisma.advertisement.findMany({
      where: {
        status: 'APPROVED',
        visibility: 'VISIBLE',
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      },
      select: {
        id: true,
        title: true,
        description: true,
        linkUrl: true,
        images: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      data: activeAds
    });
  } catch (error) {
    console.error('Error fetching mobile active ads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch advertisements' },
      { status: 500 }
    );
  }
}
