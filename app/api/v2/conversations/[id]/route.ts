import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId: id, userId: session.user.id, status: "ACTIVE" },
  });
  if (!participant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      title: true,
      imageUrl: true,
      channelType: true,
      isReadOnly: true,
      _count: {
        select: {
          participants: { where: { status: "ACTIVE" } }
        }
      },
      instituteId: true,
      batchId: true,
      institute: { select: { id: true, name: true, logo: true, slug: true, phone: true } },
      participants: {
        where: { status: "ACTIVE" },
        take: 50,
        select: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  // Check if current user is admin or manager
  const isAdmin = session.user.role === "ADMIN";
  let isManager = false;
  if (conversation.instituteId) {
    const manager = await prisma.instituteManager.findFirst({
      where: { instituteId: conversation.instituteId, userId: session.user.id },
    });
    if (manager) isManager = true;
  }
  
  // Override memberCount with the actual active participant count
  const payload = {
    ...conversation,
    memberCount: conversation._count.participants,
    currentUserCanBypassReadOnly: isAdmin || isManager,
  };
  
  return NextResponse.json({ conversation: payload });
}
