import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, level } = await request.json();

    const skill = await prisma.userSkill.create({
      data: {
        userId: session.user.id,
        name,
        level: level || 'BEGINNER',
      },
    });

    return NextResponse.json({ success: true, data: skill });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to add skill' }, { status: 500 });
  }
}
