import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { advertisementId, actionType, pageUrl } = body;

    if (!advertisementId || !actionType || !['VIEW', 'CLICK'].includes(actionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tracking payload' },
        { status: 400 }
      );
    }

    // Increment denormalized counter on Advertisement model
    if (actionType === 'VIEW') {
      await prisma.advertisement.update({
        where: { id: advertisementId },
        data: { views: { increment: 1 } }
      });
    } else if (actionType === 'CLICK') {
      await prisma.advertisement.update({
        where: { id: advertisementId },
        data: { clicks: { increment: 1 } }
      });
    }

    // Record into AdvertisementAnalytic
    await prisma.advertisementAnalytic.create({
      data: {
        advertisementId,
        actionType,
        pageUrl: pageUrl || 'mobile_app',
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking mobile ad analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record analytics' },
      { status: 500 }
    );
  }
}
