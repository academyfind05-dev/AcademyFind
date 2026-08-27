import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';
import { sendExpoPushNotification } from '@/lib/pushNotifications';

async function checkAdmin() {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== 'ADMIN') throw new Error('Admin access required');
  return session;
}

export async function GET() {
  try {
    await checkAdmin();
    const notifications = await prisma.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await checkAdmin();
    const body = await request.json();

    if (body.action === 'mark_all_read') {
      await prisma.adminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (body.id) {
      const updated = await prisma.adminNotification.update({
        where: { id: body.id },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update notification' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await checkAdmin();
    const { type, title, message, actionUrl } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Title and message are required' }, { status: 400 });
    }

    const notification = await prisma.adminNotification.create({
      data: {
        type: type || "SYSTEM_ANNOUNCEMENT",
        title,
        message,
        actionUrl: actionUrl || null,
        isRead: false,
      },
    });

    // Send Expo push notifications to all users with active pushToken
    const usersWithTokens = await prisma.user.findMany({
      where: { pushToken: { not: null } },
      select: { pushToken: true }
    });

    for (const u of usersWithTokens) {
      if (u.pushToken) {
        sendExpoPushNotification({
          pushToken: u.pushToken,
          title,
          body: message,
          data: { actionUrl }
        }).catch(err => console.error("Push send error:", err));
      }
    }

    return NextResponse.json({ success: true, data: notification, pushSentCount: usersWithTokens.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create notification' }, { status: 500 });
  }
}
