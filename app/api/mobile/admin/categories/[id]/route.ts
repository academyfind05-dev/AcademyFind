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

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.parentId !== undefined && { parentId: body.parentId || null }),
      },
    });

    return NextResponse.json({ success: true, message: 'Category updated successfully', data: category });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await checkAdmin();
    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
