import { NextRequest, NextResponse } from "next/server";
import { getBookmarkedPosts } from "@/lib/User/user/blog/getbookmark";
import { getSession } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const data = await getBookmarkedPosts({ userId: session.user.id, page, limit });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Check existing bookmark
    const existingBookmark = await prisma.blogBookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingBookmark) {
      await prisma.$transaction([
        prisma.blogBookmark.delete({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        }),
        prisma.blogPost.update({
          where: { id: postId },
          data: {
            bookmarkCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      return NextResponse.json({ success: true, bookmarked: false, message: 'Bookmark removed successfully' });
    } else {
      await prisma.$transaction([
        prisma.blogBookmark.create({
          data: {
            userId,
            postId,
          },
        }),
        prisma.blogPost.update({
          where: { id: postId },
          data: {
            bookmarkCount: {
              increment: 1,
            },
          },
        }),
      ]);

      return NextResponse.json({ success: true, bookmarked: true, message: 'Bookmark added successfully' });
    }
  } catch (error: any) {
    console.error('Mobile toggle bookmark error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
