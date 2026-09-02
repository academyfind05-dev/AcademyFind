import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; messageId: string }> };

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
    return true;
  }
  return false;
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId, messageId } = await params;
  const hasAccess = await ensureAccess(conversationId, session.user.id, session.user.role);
  if (!hasAccess) return NextResponse.json({ error: "Not a participant" }, { status: 403 });

  try {
    const body = await req.json();
    const { emoji } = body;

    if (!emoji || typeof emoji !== "string") {
      return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
    }

    // Toggle reaction: if exists, delete it, else create it.
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: session.user.id,
          emoji,
        }
      }
    });

    if (existingReaction) {
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id }
      });
      return NextResponse.json({ success: true, action: "removed" }, { status: 200 });
    } else {
      const newReaction = await prisma.messageReaction.create({
        data: {
          messageId,
          userId: session.user.id,
          emoji,
        },
        select: { id: true, emoji: true, userId: true }
      });
      return NextResponse.json({ success: true, action: "added", reaction: newReaction }, { status: 201 });
    }
  } catch (err: any) {
    console.error("POST reaction error:", err);
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 });
  }
}
