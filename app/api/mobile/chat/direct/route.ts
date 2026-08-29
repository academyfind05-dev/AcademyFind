import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';
import { getOrCreateDm } from '@/lib/chat/createDm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, username } = body;

    let targetUser: any = null;

    if (targetUserId) {
      targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    } else if (username) {
      targetUser = await prisma.user.findUnique({ where: { username } });
    }

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 });
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json({ success: false, error: 'You cannot message yourself' }, { status: 400 });
    }

    const conversation = await getOrCreateDm(session.user.id, targetUser.id);

    return NextResponse.json({
      success: true,
      data: {
        conversationId: conversation.id,
      },
    });
  } catch (error: any) {
    console.error('Direct chat creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start direct chat' },
      { status: 500 }
    );
  }
}
