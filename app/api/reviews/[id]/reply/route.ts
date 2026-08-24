import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { creditWallet } from "@/lib/wallet/credit";
import { AF_COINS_EARN } from "@/lib/wallet/af-coins";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: reviewId } = resolvedParams;
    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Reply content is required" }, { status: 400 });
    }

    // Ensure review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Create the reply (Pending by default)
    const reply = await prisma.reviewReply.create({
      data: {
        reviewId,
        userId: session.user.id,
        content: content.trim(),
        status: "PENDING",
      },
    });

    // Credit coins
    // 1. To the replier
    await creditWallet(session.user.id, AF_COINS_EARN.DO_LIKE_REPLY_REVIEW, "DO_LIKE_REPLY_REVIEW", "Earned coins for replying to a review");
    
    // 2. To the review author (if they are a different user)
    if (review.userId !== session.user.id) {
      await creditWallet(review.userId, AF_COINS_EARN.REVIEW_LIKE_REPLY, "REVIEW_LIKE_REPLY", "Someone replied to your review");
    }

    return NextResponse.json({ 
        success: true, 
        message: "Reply submitted and is pending admin approval.",
        reply 
    }, { status: 201 });

  } catch (error) {
    console.error("[REVIEW_REPLY_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
