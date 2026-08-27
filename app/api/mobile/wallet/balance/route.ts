import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const sessionObj = await prisma.session.findFirst({
        where: { token, expiresAt: { gt: new Date() } },
      });
      if (sessionObj) userId = sessionObj.userId;
    }

    if (!userId) {
      return NextResponse.json({ success: false, balance: 0 }, { status: 401 });
    }

    const wallet = await prisma.userWallet.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      balance: wallet?.balance || 0,
      lifetimeEarned: wallet?.lifetimeEarned || 0,
      lifetimeSpent: wallet?.lifetimeSpent || 0,
    });
  } catch (error: any) {
    console.error('Mobile Wallet Balance API Error:', error);
    return NextResponse.json({ success: false, balance: 0 }, { status: 500 });
  }
}
