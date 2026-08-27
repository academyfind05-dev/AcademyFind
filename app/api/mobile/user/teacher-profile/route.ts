import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { headline, bio, qualification, experience, subjects, languages } = await request.json();

    const teacherProfile = await prisma.teacherProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        headline,
        bio,
        qualification,
        experience,
        subjects: subjects || [],
        languages: languages || [],
      },
      update: {
        headline,
        bio,
        qualification,
        experience,
        subjects: subjects || [],
        languages: languages || [],
      },
    });

    return NextResponse.json({ success: true, data: teacherProfile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update teacher profile' }, { status: 500 });
  }
}
