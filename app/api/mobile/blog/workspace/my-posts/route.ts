import { NextRequest, NextResponse } from "next/server";
import { getMyPosts } from "@/lib/User/user/blog/getmyposts";
import { getSession } from "@/lib/auth/getSession";
import { BlogStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as BlogStatus | undefined;

    const data = await getMyPosts({ userId, page, limit, status });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('My Posts Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
