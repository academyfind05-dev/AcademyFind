import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const sessionObj = await prisma.session.findFirst({
        where: { token, expiresAt: { gt: new Date() } },
      });
      if (sessionObj) userId = sessionObj.userId;
    }

    if (!userId) {
      const session = await getSession();
      userId = session?.user?.id || null;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Please login first' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const role = (body.role || 'STUDENT').toUpperCase() as 'STUDENT' | 'TEACHER';

    // Check for existing membership request for this role
    const existing = await prisma.instituteMembership.findFirst({
      where: { userId, instituteId: id, role },
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        error: `You have already requested to join this institute as a ${role.toLowerCase()}.`,
      }, { status: 400 });
    }

    const institute = await prisma.institute.findUnique({
      where: { id },
      select: { name: true, managers: { select: { userId: true } } },
    });

    if (!institute) {
      return NextResponse.json({ success: false, error: 'Institute not found.' }, { status: 404 });
    }

    if (role === 'TEACHER') {
      const { designation, department, teachingSubjects, bio } = body;

      await prisma.$transaction(async (tx) => {
        const teacherProfile = await tx.teacherProfile.upsert({
          where: { userId },
          create: { userId },
          update: {},
        });

        const membership = await tx.instituteMembership.create({
          data: {
            userId,
            instituteId: id,
            role: 'TEACHER',
            status: 'PENDING',
          },
        });

        const subjectsArray = typeof teachingSubjects === 'string'
          ? teachingSubjects.split(',').map((s: string) => s.trim()).filter(Boolean)
          : (Array.isArray(teachingSubjects) ? teachingSubjects : []);

        await tx.teacherInstituteRecord.create({
          data: {
            membershipId: membership.id,
            teacherProfileId: teacherProfile.id,
            instituteId: id,
            designation: designation || null,
            department: department || null,
            teachingSubjects: subjectsArray,
            bio: bio || null,
          },
        });
      });
    } else {
      const { courseName, batchYear, passoutYear, bio } = body;

      await prisma.$transaction(async (tx) => {
        const studentProfile = await tx.studentProfile.upsert({
          where: { userId },
          create: { userId },
          update: {},
        });

        const membership = await tx.instituteMembership.create({
          data: {
            userId,
            instituteId: id,
            role: 'STUDENT',
            status: 'PENDING',
          },
        });

        await tx.studentInstituteRecord.create({
          data: {
            membershipId: membership.id,
            studentProfileId: studentProfile.id,
            instituteId: id,
            courseName: courseName || null,
            batchYear: batchYear ? Number(batchYear) : null,
            passoutYear: passoutYear ? Number(passoutYear) : null,
            bio: bio || null,
          },
        });
      });
    }

    return NextResponse.json({
      success: true,
      message: `Your request to join as a ${role.toLowerCase()} has been sent successfully.`,
    });
  } catch (error: any) {
    console.error('Mobile Join Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
