import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify user is a participant or manager
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId: id, userId: session.user.id, status: "ACTIVE" },
  });

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: { instituteId: true },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let isManager = false;
  if (conversation.instituteId) {
    const manager = await prisma.instituteManager.findFirst({
      where: { instituteId: conversation.instituteId, userId: session.user.id },
    });
    if (manager) isManager = true;
  }

  const isAdmin = session.user.role === "ADMIN";

  if (!participant && !isManager && !isAdmin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId: id, status: "ACTIVE" },
    select: {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: [
      { role: "asc" },
      { user: { name: "asc" } }
    ]
  });

  return NextResponse.json({ participants });
}
