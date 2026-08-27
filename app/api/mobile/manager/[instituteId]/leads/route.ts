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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { instituteId };
    if (status) where.status = status;

    const [leads, total] = await Promise.all([
      prisma.instituteEnquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.instituteEnquiry.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { leads, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { leadId, status, adminNote } = body;

    const lead = await prisma.instituteEnquiry.update({
      where: { id: leadId },
      data: { status, ...(adminNote && { adminNote }) },
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { instituteId } = await params;
    const body = await request.json();
    const { name, phone, email, course, message } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'Name and Phone are required' }, { status: 400 });
    }

    const fullMessage = course
      ? `Course: ${course}${message ? `. ${message}` : ''}`
      : (message || null);

    const lead = await prisma.instituteEnquiry.create({
      data: {
        instituteId,
        name,
        phone,
        email: email || null,
        message: fullMessage,
        status: 'NEW',
      },
    });

    return NextResponse.json({ success: true, message: 'Lead created successfully', data: lead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create lead' }, { status: 500 });
  }
}
