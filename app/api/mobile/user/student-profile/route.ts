import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { headline, bio, targetExam, currentClass } = await request.json();

    const studentProfile = await prisma.studentProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        headline,
        bio,
        targetExam,
        currentClass,
      },
      update: {
        headline,
        bio,
        targetExam,
        currentClass,
      },
    });

    return NextResponse.json({ success: true, data: studentProfile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update student profile' }, { status: 500 });
  }
}
