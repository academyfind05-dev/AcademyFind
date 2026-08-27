import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  // Verify participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.user.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (!participant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Cursor-based pagination
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const take = Math.min(Number(url.searchParams.get("take") ?? 50), 100);

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
          user: { select: { name: true } },
        },
      },
    },
  });

  const nextCursor =
    messages.length === take ? messages[messages.length - 1].id : null;

  // Mark conversation as read (update lastReadAt)
  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({
    messages: messages.reverse(), // chronological
    nextCursor,
  });
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.user.id, status: "ACTIVE" },
    select: { id: true },
  });

  if (!participant) return NextResponse.json({ error: "Not a participant" }, { status: 403 });

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
          select: { id: true, name: true, username: true, image: true }
        }
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageId: message.id, lastMessageAt: new Date(), lastActivityAt: new Date() },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
