import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const instituteId = searchParams.get('instituteId');
    if (!instituteId) return NextResponse.json({ success: false, error: 'Institute ID missing' }, { status: 400 });

    const isManager = await prisma.instituteManager.findFirst({
      where: { userId: session.user.id, instituteId }
    });
    if (!isManager && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
      select: { subscriptionPlan: true }
    });

    const isLocked = institute?.subscriptionPlan === 'BASIC' || institute?.subscriptionPlan === 'VERIFIED';
    if (isLocked) {
      return NextResponse.json({ success: true, data: { isLocked: true } });
    }

    const [channels, reports] = await Promise.all([
      prisma.conversation.findMany({
        where: { instituteId, type: "INSTITUTE" },
        orderBy: { channelType: "asc" },
        select: {
          id: true,
          title: true,
          channelType: true,
          isReadOnly: true,
          memberCount: true,
          lastMessage: {
            select: { content: true, sender: { select: { name: true } } },
          },
        },
      }),
      prisma.messageReport.findMany({
        where: {
          message: { conversation: { instituteId } },
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
          message: {
            select: {
              id: true,
              content: true,
              sender: { select: { name: true, username: true } },
              conversation: { select: { title: true, channelType: true } },
            },
          },
          reporter: { select: { name: true, username: true } },
        },
      })
    ]);

    return NextResponse.json({ success: true, data: { isLocked: false, channels, reports } });
  } catch (error: any) {
    console.error("Manager Chat API Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { instituteId, title, channelType, isReadOnly } = body;

    if (!instituteId || !title) {
      return NextResponse.json({ success: false, error: 'Institute ID and Channel Title are required' }, { status: 400 });
    }

    const isManager = await prisma.instituteManager.findFirst({
      where: { userId: session.user.id, instituteId }
    });
    if (!isManager && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Safely validate channelType against ChannelType enum
    const validTypes = ['GENERAL', 'STUDENTS', 'TEACHERS', 'ANNOUNCEMENTS', 'BATCH', 'STAFF', 'CUSTOM'];
    let targetType: any = (channelType && validTypes.includes(channelType)) ? channelType : 'CUSTOM';

    // If targetType is not CUSTOM, check if it already exists to prevent @@unique([instituteId, channelType]) violation
    if (targetType !== 'CUSTOM') {
      const existing = await prisma.conversation.findFirst({
        where: { instituteId, channelType: targetType }
      });
      if (existing) {
        targetType = 'CUSTOM';
      }
    }

    const channel = await prisma.conversation.create({
      data: {
        instituteId,
        title: title.trim(),
        channelType: targetType,
        isReadOnly: !!isReadOnly,
        type: 'INSTITUTE',
        createdById: session.user.id,
        participants: {
          create: {
            userId: session.user.id,
            role: 'MANAGER',
          }
        }
      },
      select: {
        id: true,
        title: true,
        channelType: true,
        isReadOnly: true,
        memberCount: true,
      }
    });

    return NextResponse.json({ success: true, data: channel });
  } catch (error: any) {
    console.error("Manager Chat POST Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { reportId, action } = body; // action: 'DISMISS' | 'DELETE'

    if (!reportId || !action) {
      return NextResponse.json({ success: false, error: 'Report ID and Action required' }, { status: 400 });
    }

    if (action === 'DELETE') {
      const report = await prisma.messageReport.findUnique({
        where: { id: reportId },
        select: { messageId: true }
      });
      if (report?.messageId) {
        await prisma.message.delete({ where: { id: report.messageId } });
      }
    }

    await prisma.messageReport.update({
      where: { id: reportId },
      data: { status: action === 'DELETE' ? 'ACTION_TAKEN' : 'DISMISSED' }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Manager Chat PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) {
      return NextResponse.json({ success: false, error: 'Channel ID is required' }, { status: 400 });
    }

    await prisma.conversation.delete({ where: { id: channelId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Manager Chat DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
