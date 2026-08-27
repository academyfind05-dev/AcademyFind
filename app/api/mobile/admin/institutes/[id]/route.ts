import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

async function checkAdmin() {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== 'ADMIN') throw new Error('Admin access required');
  return session;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await checkAdmin();
    const { id } = await params;
    const body = await request.json();

    const planWeights: Record<string, number> = {
      ULTRA: 4,
      PREMIUM: 3,
      VERIFIED: 2,
      BASIC: 1,
    };

    const updateData: any = {};
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isVerified !== undefined) updateData.isVerified = body.isVerified;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    if (body.subscriptionPlan) {
      updateData.subscriptionPlan = body.subscriptionPlan;
      updateData.planWeight = planWeights[body.subscriptionPlan] || 1;
    }

    const institute = await prisma.institute.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: 'Institute updated successfully', data: institute });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update institute' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await checkAdmin();
    const { id } = await params;
    await prisma.institute.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Institute deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete institute' }, { status: 500 });
  }
}
