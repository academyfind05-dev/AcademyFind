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

    const city = await prisma.city.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.state && { state: body.state }),
        ...(body.latitude !== undefined && { latitude: body.latitude ? parseFloat(body.latitude) : null }),
        ...(body.longitude !== undefined && { longitude: body.longitude ? parseFloat(body.longitude) : null }),
      },
    });

    return NextResponse.json({ success: true, message: 'City updated successfully', data: city });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update city' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await checkAdmin();
    const { id } = await params;
    await prisma.city.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'City deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete city' }, { status: 500 });
  }
}
