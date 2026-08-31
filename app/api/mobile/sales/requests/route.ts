import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';
import { notifyAdmins } from '@/lib/notifications/notify';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SALES_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const smId = searchParams.get('id') || session.user.id;
    const status = searchParams.get('status');

    const where: any = { salesManagerId: smId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const requests = await prisma.salesAssignmentRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            logo: true,
            city: { select: { name: true } },
            categories: { select: { category: { select: { name: true } } }, take: 2 }
          }
        },
        category: { select: { id: true, name: true, slug: true } },
        reviewedBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error: any) {
    console.error('Failed to fetch mobile sales requests:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SALES_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      type,
      instituteId,
      areaName,
      latitude,
      longitude,
      radiusKm,
      categoryId,
      reason
    } = body;

    const smId = session.user.id;

    if (!type || !['INSTITUTE', 'AREA', 'CATEGORY'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid type. Must be INSTITUTE, AREA, or CATEGORY' }, { status: 400 });
    }

    if (type === 'INSTITUTE' && !instituteId) {
      return NextResponse.json({ success: false, error: 'Please select an Institute' }, { status: 400 });
    }

    if (type === 'AREA' && (!areaName || latitude === undefined || longitude === undefined)) {
      return NextResponse.json({ success: false, error: 'Area name and coordinates are required' }, { status: 400 });
    }

    if (type === 'CATEGORY' && !categoryId) {
      return NextResponse.json({ success: false, error: 'Please select a Category' }, { status: 400 });
    }

    // Check duplicate pending
    const existing = await prisma.salesAssignmentRequest.findFirst({
      where: {
        salesManagerId: smId,
        type,
        status: 'PENDING',
        ...(type === 'INSTITUTE' ? { instituteId } : {}),
        ...(type === 'CATEGORY' ? { categoryId } : {}),
        ...(type === 'AREA' ? { areaName } : {})
      }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'You already have a pending request for this target. Please wait for Admin approval.'
      }, { status: 409 });
    }

    const newRequest = await prisma.salesAssignmentRequest.create({
      data: {
        salesManagerId: smId,
        type,
        status: 'PENDING',
        instituteId: type === 'INSTITUTE' ? instituteId : null,
        areaName: type === 'AREA' ? areaName : null,
        latitude: type === 'AREA' ? parseFloat(latitude) : null,
        longitude: type === 'AREA' ? parseFloat(longitude) : null,
        radiusKm: type === 'AREA' ? (parseFloat(radiusKm) || 3) : null,
        categoryId: type === 'CATEGORY' ? categoryId : null,
        reason: reason?.trim() || null
      },
      include: {
        institute: { select: { id: true, name: true, slug: true, address: true, logo: true } },
        category: { select: { id: true, name: true, slug: true } }
      }
    });

    let targetLabel = '';
    if (type === 'INSTITUTE') targetLabel = `Institute "${newRequest.institute?.name || instituteId}"`;
    else if (type === 'AREA') targetLabel = `Area "${areaName}" (${radiusKm || 3} km)`;
    else if (type === 'CATEGORY') targetLabel = `Category "${newRequest.category?.name || categoryId}"`;

    await notifyAdmins(
      'SALES_ASSIGNMENT_REQUEST',
      '⚡ New Assignment Request (Mobile)',
      `${session.user.name || 'Sales Manager'} requested ${targetLabel}.${reason ? ` Note: "${reason}"` : ''}`,
      '/af-ass-manage/sales_requests',
      newRequest.id
    );

    return NextResponse.json({
      success: true,
      data: newRequest,
      message: 'Assignment request submitted successfully!'
    });
  } catch (error: any) {
    console.error('Failed to submit mobile sales request:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
