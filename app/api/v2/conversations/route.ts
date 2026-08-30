import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Get all conversations user is a participant in
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: [
      { isPinned: "desc" },
      { conversation: { lastMessageAt: "desc" } },
    ],
    select: {
      id: true,
      isPinned: true,
      lastReadAt: true,
      conversationId: true,
      conversation: {
        select: {
          id: true,
          type: true,
          title: true,
          imageUrl: true,
          channelType: true,
          isReadOnly: true,
          memberCount: true,
          lastMessageAt: true,
          instituteId: true,
          batchId: true,
          institute: { select: { name: true, logo: true } },
          lastMessage: {
            select: {
              id: true,
              content: true,
              type: true,
              createdAt: true,
              sender: { select: { name: true, username: true, image: true } },
            },
          },
          participants: {
            where: { userId: { not: userId }, status: "ACTIVE" },
            take: 1,
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const conversations = participants.map((p: any) => {
    const conv = p.conversation;
    const isDirect = conv.type === "DIRECT";
    const dmUser = conv.participants[0]?.user ?? null;

    return {
      participantId: p.id,
      isPinned: p.isPinned,
      lastReadAt: p.lastReadAt,
      id: conv.id,
      type: conv.type,
      channelType: conv.channelType,
      isReadOnly: conv.isReadOnly,
      memberCount: conv.memberCount,
      lastMessageAt: conv.lastMessageAt || conv.lastMessage?.createdAt || null,
      instituteId: conv.instituteId,
      displayName: isDirect
        ? (dmUser?.name ?? "Unknown")
        : (conv.institute?.name ? `${conv.title ?? "Channel"} - ${conv.institute.name}` : (conv.title ?? "Channel")),
      displayImage: isDirect
        ? (dmUser?.image ?? null)
        : (conv.institute?.logo ?? conv.imageUrl ?? null),
      dmUserId: isDirect ? (dmUser?.id ?? null) : null,
      dmUsername: isDirect ? (dmUser?.username ?? null) : null,
      lastMessage: conv.lastMessage,
    };
  });

  // WhatsApp-style descending sorting:
  // 1. Pinned conversations stay at top
  // 2. Latest messaged / chatted conversations come first
  // 3. Empty / newly created chats without messages stay below active chats
  conversations.sort((a: any, b: any) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    const timeA = a.lastMessage?.createdAt
      ? new Date(a.lastMessage.createdAt).getTime()
      : a.lastMessageAt
        ? new Date(a.lastMessageAt).getTime()
        : 0;

    const timeB = b.lastMessage?.createdAt
      ? new Date(b.lastMessage.createdAt).getTime()
      : b.lastMessageAt
        ? new Date(b.lastMessageAt).getTime()
        : 0;

    return timeB - timeA;
  });

  return NextResponse.json({ conversations });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { targetUserId, username, instituteId } = body;

    let targetUser: any = null;
    if (targetUserId) {
      targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    } else if (username) {
      targetUser = await prisma.user.findUnique({ where: { username } });
    }

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const { getOrCreateDm } = await import("@/lib/chat/createDm");
    const conversation = await getOrCreateDm(session.user.id, targetUser.id, instituteId);

    return NextResponse.json({ success: true, conversationId: conversation.id });
  } catch (error: any) {
    console.error("Create direct conversation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start direct conversation" },
      { status: 500 }
    );
  }
}
