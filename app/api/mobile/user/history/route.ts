import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const sessionObj = await prisma.session.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
    });
    if (sessionObj) return sessionObj.userId;
  }
  const session = await getSession();
  return session?.user?.id || null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const history = await prisma.userHistory.findMany({
      where: { userId },
      include: {
        institute: {
          select: {
            id: true, name: true, slug: true, logo: true, imageUrl: true, gallery: true,
            averageRating: true, reviewCount: true,
            city: { select: { name: true } },
          },
        },
      },
      orderBy: { viewedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error: any) {
    console.error('History GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: true, message: 'Saved locally' });
    }

    const body = await request.json();
    const { instituteId } = body;

    if (!instituteId) {
      return NextResponse.json({ success: false, error: 'Institute ID is required' }, { status: 400 });
    }

    // Upsert UserHistory record
    const history = await prisma.userHistory.upsert({
      where: {
        userId_instituteId: {
          userId,
          instituteId,
        },
      },
      create: {
        userId,
        instituteId,
        viewedAt: new Date(),
      },
      update: {
        viewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error: any) {
    console.error('History POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
