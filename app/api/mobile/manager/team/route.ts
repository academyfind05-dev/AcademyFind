import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const instituteId = searchParams.get('instituteId');
    if (!instituteId) return NextResponse.json({ success: false, error: 'Institute ID missing' }, { status: 400 });

    const isManager = await prisma.instituteManager.findFirst({
      where: { userId: session.user.id, instituteId }
    });
    if (!isManager && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
      include: { 
        managers: { 
          include: { user: { select: { name: true, email: true, image: true, createdAt: true } } } 
        } 
      }
    });

    if (!institute) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const plan = institute.subscriptionPlan || "BASIC"; 
    let maxMembers = 1;
    if (plan === "PREMIUM") maxMembers = 3;
    if (plan === "ULTRA") maxMembers = 5;

    return NextResponse.json({ 
      success: true, 
      data: { 
        team: institute.managers,
        plan,
        maxMembers,
        currentMembers: institute.managers.length
      } 
    });
  } catch (error: any) {
    console.error("Manager Team API Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { instituteId, email } = body;

    if (!instituteId || !email) {
      return NextResponse.json({ success: false, error: 'Institute ID and Email are required' }, { status: 400 });
    }

    const isManager = await prisma.instituteManager.findFirst({
      where: { userId: session.user.id, instituteId }
    });
    if (!isManager && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
      include: { managers: true }
    });
    if (!institute) return NextResponse.json({ success: false, error: 'Institute not found' }, { status: 404 });

    const plan = institute.subscriptionPlan || "BASIC"; 
    let maxAllowed = 1;
    if (plan === "PREMIUM") maxAllowed = 3;
    if (plan === "ULTRA") maxAllowed = 5;

    if (institute.managers.length >= maxAllowed) {
      return NextResponse.json({ success: false, error: `Your ${plan} plan allows up to ${maxAllowed} team members.` }, { status: 400 });
    }

    const userToAdd = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (!userToAdd) return NextResponse.json({ success: false, error: 'No user found with this email on AcademyFind.' }, { status: 404 });

    const alreadyManager = institute.managers.find(m => m.userId === userToAdd.id);
    if (alreadyManager) return NextResponse.json({ success: false, error: 'This user is already a team member.' }, { status: 400 });

    await prisma.$transaction([
      prisma.instituteManager.create({
        data: { instituteId, userId: userToAdd.id }
      }),
      prisma.user.update({
        where: { id: userToAdd.id },
        data: { role: "INSTITUTE_MANAGER" }
      })
    ]);

    const updatedTeam = await prisma.instituteManager.findMany({
      where: { instituteId },
      include: { user: { select: { name: true, email: true, image: true, createdAt: true } } }
    });

    return NextResponse.json({ success: true, data: { team: updatedTeam, currentMembers: updatedTeam.length, maxMembers: maxAllowed, plan } });

  } catch (error: any) {
    console.error("Manager Team POST Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const instituteId = searchParams.get('instituteId');
    const userId = searchParams.get('userId');

    if (!instituteId || !userId) {
      return NextResponse.json({ success: false, error: 'Institute ID and User ID missing' }, { status: 400 });
    }

    const isManager = await prisma.instituteManager.findFirst({
      where: { userId: session.user.id, instituteId }
    });
    if (!isManager && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.instituteManager.deleteMany({
      where: { instituteId, userId }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Manager Team DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
