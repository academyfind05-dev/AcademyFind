import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;

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
          role: true,
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

  // Check if current user is participant
  let isParticipant = conversation.participants.some((p: any) => p.user?.id === userId);
  const isAdmin = session.user.role === "ADMIN";
  let isManager = false;

  if (conversation.instituteId) {
    const manager = await prisma.instituteManager.findFirst({
      where: { instituteId: conversation.instituteId, userId },
    });
    if (manager) isManager = true;
  }

  // If user has access (is manager/admin or institute member) but not in participant table, auto-add
  if (!isParticipant) {
    if (isAdmin || isManager || conversation.type === "INSTITUTE" || conversation.type === "BATCH") {
      try {
        await prisma.conversationParticipant.upsert({
          where: { conversationId_userId: { conversationId: id, userId } },
          create: { conversationId: id, userId, role: isManager || isAdmin ? "ADMIN" : "MEMBER", status: "ACTIVE" },
          update: { status: "ACTIVE", leftAt: null, isHidden: false },
        });
        isParticipant = true;
      } catch (e) {
        console.error("Auto participant add error:", e);
      }
    }
  }

  // Mark conversation as read for this participant
  prisma.conversationParticipant.updateMany({
    where: { conversationId: id, userId },
    data: { lastReadAt: new Date() },
  }).catch((err) => console.error("Error updating lastReadAt:", err));

  // Override memberCount with the actual active participant count
  const payload = {
    ...conversation,
    memberCount: conversation._count.participants,
    currentUserCanBypassReadOnly: isAdmin || isManager,
  };

  return NextResponse.json({ conversation: payload });
}
