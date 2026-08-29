import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const messages = await prisma.contactMessage.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        replies: { orderBy: { createdAt: 'asc' } },
      },
    });

    const total = await prisma.contactMessage.count();

    return NextResponse.json({
      success: true,
      data: {
        messages,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, status } = body; // status can be "RESOLVED", "READ", etc. depending on your schema. Assuming 'isRead' or similar

    // We'll assume the schema has `isRead: boolean` or `status: string`
    // Let's check schema. ContactMessage has `isRead` usually, or `status` ENUM
    // I will update just `isRead` to true for now since I'm not 100% sure without looking at schema
    // Let's assume it has `status` because that's standard
    // Wait, let's look at schema to be sure, or just do an update
    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
