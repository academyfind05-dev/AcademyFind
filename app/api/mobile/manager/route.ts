import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // If user is ADMIN, allow managing ALL institutes (exact parity with Web Admin)
    if (session.user.role === 'ADMIN') {
      const allInstitutes = await prisma.institute.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: {
          id: true, name: true, slug: true, logo: true, imageUrl: true, gallery: true,
          averageRating: true, reviewCount: true, isVerified: true, isActive: true,
          city: { select: { name: true } },
          _count: {
            select: {
              enquiries: { where: { status: 'NEW' } },
              memberships: { where: { status: 'PENDING' } },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: allInstitutes.map((inst: any) => ({
          ...inst,
          newLeads: inst._count?.enquiries || 0,
          pendingMembers: inst._count?.memberships || 0,
        })),
      });
    }

    // For regular INSTITUTE_MANAGER users, get institutes they explicitly manage
    const managedInstitutes = await prisma.instituteManager.findMany({
      where: { userId: session.user.id },
      include: {
        institute: {
          select: {
            id: true, name: true, slug: true, logo: true, imageUrl: true, gallery: true,
            averageRating: true, reviewCount: true, isVerified: true, isActive: true,
            city: { select: { name: true } },
            _count: {
              select: {
                enquiries: { where: { status: 'NEW' } },
                memberships: { where: { status: 'PENDING' } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: managedInstitutes.map((m: any) => ({
        ...m.institute,
        newLeads: m.institute._count?.enquiries || 0,
        pendingMembers: m.institute._count?.memberships || 0,
      })),
    });
  } catch (error: any) {
    console.error('Manager GET API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
