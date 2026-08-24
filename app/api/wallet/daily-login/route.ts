import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/wallet/credit";
import { AF_COINS_EARN } from "@/lib/wallet/af-coins";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the last daily login transaction
    const lastLoginTx = await prisma.walletTransaction.findFirst({
      where: {
        wallet: { userId },
        source: "DAILY_LOGIN",
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    if (lastLoginTx && lastLoginTx.createdAt > twentyFourHoursAgo) {
        return NextResponse.json({ success: false, message: "Already claimed today" });
    }

    // Determine streak (If you want to enforce 7+ days straight)
    // For simplicity, we just credit it once every 24 hours if they click claim
    // If you need 7 days strictly, you'd track current streak. Let's assume a simple 1/day for now.
    
    await creditWallet(userId, AF_COINS_EARN.DAILY_LOGIN_STREAK, "DAILY_LOGIN", "Daily login reward");

    return NextResponse.json({ success: true, message: "Claimed daily login reward!" });
  } catch (error: any) {
    console.error("Daily Login Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
