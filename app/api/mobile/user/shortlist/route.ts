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
    if (!userId) return NextResponse.json({ success: true, data: [] });

    const shortlist = await prisma.userShortlist.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: shortlist });
  } catch (error: any) {
    console.error('Shortlist GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Please login first' }, { status: 401 });
    }

    const { instituteId } = await request.json();
    if (!instituteId) {
      return NextResponse.json({ success: false, error: 'Institute ID is required' }, { status: 400 });
    }

    const existing = await prisma.userShortlist.findFirst({
      where: { userId, instituteId },
    });

    if (existing) {
      await prisma.userShortlist.delete({
        where: {
          userId_instituteId: {
            userId,
            instituteId,
          },
        },
      });
      return NextResponse.json({ success: true, data: { action: 'removed', isShortlisted: false } });
    }

    const item = await prisma.userShortlist.create({
      data: { userId, instituteId },
    });

    return NextResponse.json({ success: true, data: { action: 'added', isShortlisted: true, item } });
  } catch (error: any) {
    console.error('Shortlist POST Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
