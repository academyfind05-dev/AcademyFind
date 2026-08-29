import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';
import { autoGrantDailyLoginBonus } from '@/lib/wallet/auto-daily-login';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Auto-credit daily login bonus on app launch
    await autoGrantDailyLoginBonus(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, image: true, role: true,
        phone: true, username: true,
        createdAt: true, updatedAt: true,
        studentProfile: true,
        teacherProfile: true,
        educations: { orderBy: { createdAt: 'desc' } },
        experiences: { orderBy: { createdAt: 'desc' } },
        skills: true,
        achievements: true,
        memberships: {
          select: {
            id: true,
            role: true,
            status: true,
            createdAt: true,
            institute: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                address: true,
                city: { select: { name: true } },
              }
            }
          }
        },
        _count: {
          select: {
            reviews: true,
            shortlisted: true,
            blogBookmarks: true,
            memberships: true,
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Fetch Wallet balance & Enquiries count safely using exact Prisma models
    let enquiriesCount = 0;
    if (user.phone || user.email) {
      const filters: any[] = [];
      if (user.phone) filters.push({ phone: user.phone });
      if (user.email) filters.push({ email: user.email });

      enquiriesCount = await prisma.instituteEnquiry.count({
        where: {
          OR: filters,
        },
      });
    }

    const wallet = await prisma.userWallet.findUnique({
      where: { userId: session.user.id },
      select: { balance: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        enquiriesCount,
        afcBalance: wallet?.balance || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, username } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone,
        username,
      },
      select: {
        id: true, name: true, email: true, image: true, role: true,
        phone: true, username: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
