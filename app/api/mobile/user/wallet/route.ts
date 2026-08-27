import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';
import { autoGrantDailyLoginBonus } from '@/lib/wallet/auto-daily-login';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Auto-credit daily login bonus on wallet access
    await autoGrantDailyLoginBonus(session.user.id);

    let wallet = await prisma.userWallet.findUnique({
      where: { userId: session.user.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!wallet) {
      wallet = await prisma.userWallet.create({
        data: {
          userId: session.user.id,
          balance: 10,
          lifetimeEarned: 10,
          lifetimeSpent: 0
        },
        include: {
          transactions: true
        }
      });
    }

    return NextResponse.json({ success: true, data: wallet });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch wallet' }, { status: 500 });
  }
}
