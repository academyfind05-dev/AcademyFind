import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ count: 0 });

  const isAdmin = session.user.role === "ADMIN";

  if (isAdmin) {
    const count = await prisma.adminNotification.count({
      where: { isRead: false },
    });
    return NextResponse.json({ count });
  }

  const count = await prisma.userNotification.count({
    where: { userId: session.user.id, isRead: false },
  });
  return NextResponse.json({ count });
}
