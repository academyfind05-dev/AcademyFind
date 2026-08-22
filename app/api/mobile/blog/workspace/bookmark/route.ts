import { NextRequest, NextResponse } from "next/server";
import { getBookmarkedPosts } from "@/lib/User/user/blog/getbookmark";
import { toggleBookmark } from "@/lib/User/user/blog/togglebookmark";
import { getSession } from "@/lib/auth/getSession";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // getBookmarkedPosts checks redirect("/login") which might fail in API route, but since we verified session, it shouldn't hit it.
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

    const result = await toggleBookmark(postId);
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ success: false, error: result.error || result.message }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
