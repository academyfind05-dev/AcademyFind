import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

async function checkAdmin() {
  const session = await getSession();
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function GET(request: NextRequest) {
  try {
    await checkAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';

    const whereCondition: any = {
      isForwarded: false
    };

    if (status !== 'ALL') {
      whereCondition.status = status;
    }

    const callbacks = await prisma.instituteEnquiry.findMany({
      where: whereCondition,
      include: {
        institute: { select: { id: true, name: true, phone: true, slug: true } },
        distributionLogs: {
          include: { admin: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, data: callbacks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await checkAdmin();
    const { id, status, userContactStatus, adminNote } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Callback ID is required' }, { status: 400 });
    }

    const currentCallback = await prisma.instituteEnquiry.findUnique({ where: { id } });
    if (!currentCallback) {
      return NextResponse.json({ success: false, error: 'Callback not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status && status !== currentCallback.status) {
      updateData.status = status;
      // Record history
      await prisma.enquiryStatusHistory.create({
        data: {
          enquiryId: id,
          oldStatus: currentCallback.status,
          newStatus: status,
          statusType: 'INSTITUTE',
        }
      });
    }

    if (userContactStatus && userContactStatus !== currentCallback.userContactStatus) {
      updateData.userContactStatus = userContactStatus;
      await prisma.enquiryStatusHistory.create({
        data: {
          enquiryId: id,
          oldStatus: currentCallback.userContactStatus,
          newStatus: userContactStatus,
          statusType: 'STUDENT',
        }
      });
    }

    if (adminNote !== undefined) {
      updateData.adminNote = adminNote;
    }

    const updated = await prisma.instituteEnquiry.update({
      where: { id },
      data: updateData,
      include: {
        institute: { select: { id: true, name: true, phone: true, slug: true } },
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await checkAdmin();
    const { enquiryId, targetInstituteIds, adminNote } = await request.json();

    if (!enquiryId || !targetInstituteIds || !Array.isArray(targetInstituteIds) || targetInstituteIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Target institutes are required for forwarding' }, { status: 400 });
    }

    const originalEnquiry = await prisma.instituteEnquiry.findUnique({
      where: { id: enquiryId }
    });

    if (!originalEnquiry) {
      return NextResponse.json({ success: false, error: 'Enquiry not found' }, { status: 404 });
    }

    // Create forwarded copies for each target institute
    for (const instId of targetInstituteIds) {
      await prisma.instituteEnquiry.create({
        data: {
          instituteId: instId,
          name: originalEnquiry.name,
          phone: originalEnquiry.phone,
          email: originalEnquiry.email,
          message: originalEnquiry.message,
          isForwarded: true,
          parentId: originalEnquiry.id,
          status: 'NEW',
        }
      });
    }

    // Log distribution
    const log = await prisma.leadDistributionLog.create({
      data: {
        enquiryId,
        adminId: adminUser.id,
        mode: 'individual',
        targetInstituteIds,
        targetCount: targetInstituteIds.length,
        adminNote: adminNote || null,
      }
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await checkAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await prisma.instituteEnquiry.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Callback deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
  }
}
