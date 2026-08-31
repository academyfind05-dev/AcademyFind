import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";
import { notifyChatParticipants } from "@/lib/chat/notifyChatParticipants";

type Params = { params: Promise<{ id: string }> };

async function ensureAccess(conversationId: string, userId: string, userRole?: string | null) {
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId, status: "ACTIVE" },
  });

  if (participant) return true;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, instituteId: true, type: true },
  });

  if (!conversation) return false;

  const isAdmin = userRole === "ADMIN";
  let isManager = false;

  if (conversation.instituteId) {
    const manager = await prisma.instituteManager.findFirst({
      where: { instituteId: conversation.instituteId, userId },
    });
    if (manager) isManager = true;
  }

  if (isAdmin || isManager || conversation.type === "INSTITUTE" || conversation.type === "BATCH") {
    try {
      await prisma.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId, userId } },
        create: { conversationId, userId, role: isManager || isAdmin ? "ADMIN" : "MEMBER", status: "ACTIVE" },
        update: { status: "ACTIVE", leftAt: null, isHidden: false },
      });
      return true;
    } catch (e) {
      console.error("Auto participant add in messages error:", e);
    }
  }

  return false;
}

export async function GET(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  const hasAccess = await ensureAccess(conversationId, session.user.id, session.user.role);
  if (!hasAccess) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Cursor-based pagination
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const take = Math.min(Number(url.searchParams.get("take") ?? 50), 100);

  // Mark conversation as read for the current user
  prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: session.user.id },
    data: { lastReadAt: new Date() },
  }).catch((err: any) => console.error("Error updating lastReadAt:", err));

  const messages = await prisma.message.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      content: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      isEdited: true,
      isPinned: true,
      isDeleted: true,
      replyToId: true,
      replyTo: {
        select: {
          id: true,
          content: true,
          sender: { select: { name: true } },
        },
      },
      sender: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      attachments: {
        select: { id: true, fileUrl: true, fileName: true, mimeType: true, size: true },
      },
      reactions: {
        select: {
          id: true,
          emoji: true,
          userId: true,
        },
      },
    },
  });

  let nextCursor: string | undefined = undefined;
  if (messages.length === take) {
    nextCursor = messages[messages.length - 1].id;
  }

  return NextResponse.json({
    messages,
    nextCursor,
  });
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  const hasAccess = await ensureAccess(conversationId, session.user.id, session.user.role);
  if (!hasAccess) return NextResponse.json({ error: "Not a participant" }, { status: 403 });

  try {
    const body = await req.json();
    const { content, type = "TEXT", replyToId } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content: content.trim(),
        type,
        replyToId,
      },
      select: {
        id: true,
        content: true,
        type: true,
        createdAt: true,
        sender: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // 🔔 Notify all other participants (In-App + Mobile Push Notifications)
    notifyChatParticipants({
      conversationId,
      senderId: session.user.id,
      messageContent: content.trim(),
      messageType: type,
    }).catch((notifErr) => console.error("Chat notification error:", notifErr));

    return NextResponse.json({ message }, { status: 201 });
  } catch (err: any) {
    console.error("POST message error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
