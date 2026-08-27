import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, role, company, location, description, startDate, endDate } = await request.json();

    const exp = await prisma.userExperience.create({
      data: {
        userId: session.user.id,
        role: role || title || 'Faculty / Mentor',
        company: company || 'Institute',
        description,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: exp });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to add experience' }, { status: 500 });
  }
}
