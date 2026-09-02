import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ notifications: [] });

  const isAdmin = session.user.role === "ADMIN";

  if (isAdmin) {
    const notifications = await prisma.adminNotification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        referenceId: true,
        actionUrl: true,
        isRead: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ notifications });
  }



  const notifications = await prisma.userNotification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      entityId: true,
      isRead: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ notifications });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, all } = body as { id?: string; all?: boolean };
  const isAdmin = session.user.role === "ADMIN";

  if (all) {
    if (isAdmin) {
      await prisma.adminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
    } else {
      await prisma.userNotification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
    }
    return NextResponse.json({ success: true });
  }

  if (id) {
    if (isAdmin) {
      await prisma.adminNotification.updateMany({
        where: { id },
        data: { isRead: true },
      });
    } else {
      await prisma.userNotification.updateMany({
        where: { id, userId: session.user.id },
        data: { isRead: true },
      });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Missing id or all" }, { status: 400 });
}
