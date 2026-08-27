import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';
import { notifyAdmins } from '@/lib/notifications/notify';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    if (session.user.role !== 'SALES_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || session.user.id;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = { salesManagerId: id };
    if (status && status !== 'ALL') {
      where.contactStatus = status;
    }
    if (search) {
      where.institute = { name: { contains: search, mode: "insensitive" } };
    }

    const assignments = await prisma.salesAssignment.findMany({
      where,
      include: {
        institute: {
          select: {
            name: true,
            email: true,
            phone: true,
            city: { select: { name: true } },
            categories: {
              include: { category: { select: { name: true } } },
              take: 2,
            },
          }
        }
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error("Sales Assignments API Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || (session.user.role !== 'SALES_MANAGER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { assignmentId, contactStatus, notes } = await request.json();
    if (!assignmentId || !contactStatus) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Verify ownership
    const assignment = await prisma.salesAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || (assignment.salesManagerId !== session.user.id && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Assignment not found or forbidden' }, { status: 403 });
    }

    const updateData: any = { contactStatus };
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.salesAssignment.update({
      where: { id: assignmentId },
      data: updateData,
      include: {
        institute: { select: { name: true } },
        salesManager: { select: { id: true, name: true } }
      }
    });

    // 🔔 Notify Admins about the status update
    const managerName = updated.salesManager?.name || session.user.name || "Sales Manager";
    const instName = updated.institute?.name || "Institute";
    notifyAdmins(
      "SALES_ASSIGNMENT_UPDATE",
      `Sales Assignment Updated: ${instName}`,
      `${managerName} updated status to "${contactStatus}" for ${instName}.`,
      `/af-ass-manage/sales_manager/${updated.salesManagerId}`,
      updated.id
    ).catch(e => console.error("Admin notification error:", e));

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Sales Assignments PUT Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
