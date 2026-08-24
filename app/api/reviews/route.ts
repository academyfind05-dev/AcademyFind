import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/wallet/credit";
import { AF_COINS_EARN } from "@/lib/wallet/af-coins";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Please login first" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { instituteId, rating, comment } = body;

    // 1. Basic Sanity Check
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Please provide a valid rating between 1 and 5." },
        { status: 400 }
      );
    }

    // Check if it's a new review to award coins
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_instituteId: { userId: session.user.id, instituteId }
      }
    });

    // 2. Upsert the Review (Create or Edit)
    await prisma.review.upsert({
      where: {
        userId_instituteId: {
          userId: session.user.id,
          instituteId,
        },
      },
      update: {
        rating,
        comment,
        status: "PENDING", // 🚀 IMPORTANT: Agar user edit karta hai, toh wapas Pending me daalo
      },
      create: {
        rating,
        comment,
        instituteId,
        userId: session.user.id,
        status: "PENDING", // 🚀 Default pending
      },
    });

    if (!existingReview) {
      await creditWallet(session.user.id, AF_COINS_EARN.WRITE_REVIEW, "WRITE_REVIEW", "Earned coins for writing a review");
    }

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully and is pending approval."
    });
    
  } catch (error) {
    console.error("Review Submit Error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}