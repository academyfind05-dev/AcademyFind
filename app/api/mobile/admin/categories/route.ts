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
    const categories = await prisma.category.findMany({
      include: {
        parent: { select: { name: true } },
        _count: { select: { institutes: true } },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await checkAdmin();
    const body = await request.json();
    const { name, parentId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
    }

    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let existing = await prisma.category.findUnique({ where: { slug } });
    let counter = 1;
    while (existing) {
      slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${counter}`;
      existing = await prisma.category.findUnique({ where: { slug } });
      counter++;
    }

    let level = 0;
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (parent) level = parent.level + 1;
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        level,
        parentId: parentId || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, message: 'Category created successfully', data: category });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create category' }, { status: 500 });
  }
}
