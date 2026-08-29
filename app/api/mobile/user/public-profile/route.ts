import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const userId = searchParams.get('userId');

    if (!username && !userId) {
      return NextResponse.json({ success: false, error: 'Missing username or userId' }, { status: 400 });
    }

    const where = userId ? { id: userId } : { username: username! };

    const user = await prisma.user.findUnique({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        coverImage: true,
        role: true,
        createdAt: true,
        studentProfile: true,
        teacherProfile: true,
        educations: { orderBy: { createdAt: 'desc' } },
        experiences: { orderBy: { createdAt: 'desc' } },
        achievements: { orderBy: { createdAt: 'desc' } },
        skills: true,
        _count: {
          select: {
            communityQuestions: true,
            communityAnswers: true,
            reviews: true,
            shortlisted: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error("Public profile GET error:", error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
