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

export async function GET(request: NextRequest) {
  try {
    await checkAdmin();
    const cities = await prisma.city.findMany({
      include: { _count: { select: { institutes: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: cities });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await checkAdmin();
    const body = await request.json();
    const { name, state, latitude, longitude } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'City name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const city = await prisma.city.create({
      data: {
        name,
        slug,
        state: state || 'India',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    });

    return NextResponse.json({ success: true, message: 'City added successfully', data: city });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to add city' }, { status: 500 });
  }
}
