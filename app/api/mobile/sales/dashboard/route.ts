import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    if (session.user.role !== 'SALES_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || session.user.id;

    const [assignments, assignedAreas] = await Promise.all([
      prisma.salesAssignment.findMany({
        where: { salesManagerId: id },
        include: {
          institute: {
            select: {
              name: true,
              city: { select: { name: true } },
              categories: {
                include: { category: { select: { name: true } } },
                take: 1,
              },
            }
          },
          areaAssignment: {
            select: {
              id: true,
              areaName: true,
              radiusKm: true,
            }
          }
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.salesAreaAssignment.findMany({
        where: { salesManagerId: id },
        include: {
          institutes: {
            select: {
              id: true,
              contactStatus: true,
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const now = new Date();

    const total = assignments.length;
    const notContacted = assignments.filter((a: any) => a.contactStatus === "NOT_CONTACTED").length;
    const contacted = assignments.filter((a: any) => a.contactStatus === "CONTACTED").length;
    const onboarded = assignments.filter((a: any) => a.contactStatus === "ONBOARDED").length;
    const overdue = assignments.filter((a: any) =>
      a.deadline && new Date(a.deadline) < now && a.contactStatus !== "ONBOARDED"
    ).length;

    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = assignments
      .filter((a: any) =>
        a.deadline &&
        new Date(a.deadline) >= now &&
        new Date(a.deadline) <= sevenDaysLater &&
        a.contactStatus !== "ONBOARDED"
      )
      .sort((a: any, b: any) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

    return NextResponse.json({ 
      success: true, 
      data: {
        stats: { total, notContacted, contacted, onboarded, overdue },
        upcomingDeadlines,
        assignedAreas,
        recentActivity: assignments.slice(0, 5)
      } 
    });
  } catch (error: any) {
    console.error("Sales Dashboard API Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
