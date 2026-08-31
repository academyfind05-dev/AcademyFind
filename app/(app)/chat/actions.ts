"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/requireAuth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDm } from "@/lib/chat/createDm";
import { ensureInstituteChannels } from "@/lib/chat/ensureInstituteChannels";
import { moderateContent } from "@/lib/chat/moderateContent";
import { notifyUser } from "@/lib/notifications/notify";
import { notifyChatParticipants } from "@/lib/chat/notifyChatParticipants";

// ─── sendMessage ──────────────────────────────────────────
const sendSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  type: z.enum(["TEXT", "IMAGE", "FILE", "SYSTEM"]).default("TEXT"),
  replyToId: z.string().cuid().optional(),
});

export async function sendMessage(
  conversationId: string,
  formData: FormData,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const session = await requireAuth();

  // Check participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.user.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (!participant) return { success: false, error: "Not a participant." };

  const parsed = sendSchema.safeParse({
    content: formData.get("content"),
    type: formData.get("type") || "TEXT",
    replyToId: formData.get("replyToId") || undefined,
  });
  if (!parsed.success) return { success: false, error: "Invalid message." };

  // Content moderation
  const modResult = moderateContent(parsed.data.content);
  if (!modResult.ok) return { success: false, error: modResult.reason };

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: session.user.id,
      content: parsed.data.content,
      type: parsed.data.type,
      replyToId: parsed.data.replyToId,
    },
    select: { id: true },
  });

  // Update conversation lastMessage
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageId: message.id, lastMessageAt: new Date(), lastActivityAt: new Date() },
  });

  // 🔔 Notify participants (In-App + Push Notifications)
  notifyChatParticipants({
    conversationId,
    senderId: session.user.id,
    messageContent: parsed.data.content,
    messageType: parsed.data.type,
  }).catch((err) => console.error("Chat notification error:", err));

  return { success: true, messageId: message.id };
}

// ─── markConversationRead ─────────────────────────────────
export async function markConversationRead(conversationId: string) {
  const session = await requireAuth();
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: session.user.id },
    data: { lastReadAt: new Date() },
  });
}

// ─── pinConversation / unpinConversation ──────────────────
export async function pinConversation(conversationId: string) {
  const session = await requireAuth();
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: session.user.id },
    data: { isPinned: true },
  });
}

export async function unpinConversation(conversationId: string) {
  const session = await requireAuth();
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: session.user.id },
    data: { isPinned: false },
  });
}

// ─── reportMessage ────────────────────────────────────────
const reportSchema = z.object({
  reason: z.enum([
    "SPAM",
    "INAPPROPRIATE",
    "HARASSMENT",
    "MISINFORMATION",
    "OTHER",
  ]),
  description: z.string().trim().max(500).optional(),
});

export async function reportMessage(
  messageId: string,
  reason: string,
  description?: string,
) {
  const session = await requireAuth();

  const parsed = reportSchema.safeParse({ reason, description });
  if (!parsed.success) return { success: false };

  const existing = await prisma.messageReport.findFirst({
    where: { messageId, reporterId: session.user.id },
  });
  if (existing) return { success: false, error: "Already reported." };

  await prisma.messageReport.create({
    data: {
      messageId,
      reporterId: session.user.id,
      reason: parsed.data.reason,
      description: parsed.data.description,
    },
  });
  return { success: true };
}

// ─── deleteMessage ────────────────────────────────────────
export async function deleteMessage(messageId: string) {
  const session = await requireAuth();

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true, conversationId: true },
  });

  if (!message || message.senderId !== session.user.id) {
    return { success: false, error: "Not authorized." };
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), content: "[Message deleted]" },
  });

  return { success: true };
}

// ─── addReaction ──────────────────────────────────────────
export async function addReaction(messageId: string, emoji: string) {
  const session = await requireAuth();

  // Toggle: if already reacted with same emoji, remove it
  const existing = await prisma.messageReaction.findFirst({
    where: { messageId, userId: session.user.id, emoji },
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
    return { success: true, removed: true };
  }

  await prisma.messageReaction.create({
    data: { messageId, userId: session.user.id, emoji },
  });
  return { success: true, removed: false };
}

// ─── startDirectMessage ───────────────────────────────────
export async function startDirectMessage(targetUserId: string) {
  const session = await requireAuth();
  if (targetUserId === session.user.id) return { error: "Cannot DM yourself." };

  const conversation = await getOrCreateDm(session.user.id, targetUserId);
  redirect(`/chat/${conversation.id}`);
}
