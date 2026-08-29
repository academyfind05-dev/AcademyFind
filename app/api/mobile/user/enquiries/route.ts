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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, email: true },
    });

    if (!user || (!user.phone && !user.email)) {
      return NextResponse.json({ success: true, data: [] });
    }

    const filters: any[] = [];
    if (user.phone) filters.push({ phone: user.phone });
    if (user.email) filters.push({ email: user.email });

    const enquiries = await prisma.instituteEnquiry.findMany({
      where: {
        OR: filters,
      },
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            address: true,
            city: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: enquiries });
  } catch (error: any) {
    console.error('Mobile User Enquiries GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
