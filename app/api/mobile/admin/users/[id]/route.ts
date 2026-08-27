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

    const updateData: any = {};
    if (body.role) updateData.role = body.role; // USER, ADMIN, MANAGER, SALES_MANAGER
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: 'User updated successfully', data: user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await checkAdmin();
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
