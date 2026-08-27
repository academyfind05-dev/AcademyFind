import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { type, institutionName, courseOrClass, score } = await request.json();

    const edu = await prisma.userEducation.create({
      data: {
        userId: session.user.id,
        type: type || 'SCHOOL',
        institutionName,
        courseOrClass,
        score,
      },
    });

    return NextResponse.json({ success: true, data: edu });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to add education' }, { status: 500 });
  }
}
