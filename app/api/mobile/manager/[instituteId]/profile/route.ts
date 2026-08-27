import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/getSession';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { instituteId } = await params;

    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
      include: {
        city: true,
        categories: { include: { category: true } },
        facilities: { orderBy: { order: 'asc' } },
        highlightStats: { orderBy: { order: 'asc' } },
        operatingHours: { orderBy: { dayOfWeek: 'asc' } },
        faqs: { orderBy: { order: 'asc' } },
      },
    });

    if (!institute) {
      return NextResponse.json({ success: false, error: 'Institute not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: institute });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { instituteId } = await params;
    const body = await request.json();

    const {
      name, description, phone, email, website, address, feeInfo,
      gallery, imageUrl, coverImage, logo, youtubeVideos,
      facebookUrl, instagramUrl, telegramUrl, youtubeUrl, linkedinUrl
    } = body;

    const institute = await prisma.institute.update({
      where: { id: instituteId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(address !== undefined && { address }),
        ...(feeInfo !== undefined && { feeInfo }),
        ...(gallery !== undefined && { gallery }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(coverImage !== undefined && { coverImage }),
        ...(logo !== undefined && { logo }),
        ...(youtubeVideos !== undefined && { youtubeVideos }),
        ...(facebookUrl !== undefined && { facebookUrl }),
        ...(instagramUrl !== undefined && { instagramUrl }),
        ...(telegramUrl !== undefined && { telegramUrl }),
        ...(youtubeUrl !== undefined && { youtubeUrl }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
      },
    });

    return NextResponse.json({ success: true, data: institute });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
