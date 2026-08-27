import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { instituteId } = await params;

    const members = await prisma.instituteMembership.findMany({
      where: { instituteId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: members });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { membershipId, action } = body; // action: 'approve' | 'reject'

    const membership = await prisma.instituteMembership.update({
      where: { id: membershipId },
      data: {
        status: action === 'approve' ? 'ACTIVE' : 'REJECTED',
        isActive: action === 'approve',
        ...(action === 'approve' && { joinedAt: new Date() }),
      },
    });

    return NextResponse.json({ success: true, data: membership });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ instituteId: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { instituteId } = await params;
    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'User email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User with this email not found' }, { status: 404 });
    }

    const membership = await prisma.instituteMembership.create({
      data: {
        instituteId,
        userId: user.id,
        role: role || 'STUDENT',
        status: 'ACTIVE',
        isActive: true,
        joinedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json({ success: true, message: 'Member added successfully', data: membership });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to add member' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const membershipId = searchParams.get('id');

    if (!membershipId) {
      return NextResponse.json({ success: false, error: 'Membership ID required' }, { status: 400 });
    }

    await prisma.instituteMembership.delete({ where: { id: membershipId } });
    return NextResponse.json({ success: true, message: 'Member removed successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to remove member' }, { status: 500 });
  }
}