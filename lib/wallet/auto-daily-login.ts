import { prisma } from "@/lib/prisma";
import { creditWallet } from "./credit";
import { AF_COINS_EARN } from "./af-coins";

export async function autoGrantDailyLoginBonus(userId: string) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if user already got DAILY_LOGIN transaction today
    const existingTx = await prisma.walletTransaction.findFirst({
      where: {
        wallet: { userId },
        source: "DAILY_LOGIN",
        createdAt: { gte: startOfToday }
      }
    });

    if (!existingTx) {
      // Auto-credit 1 AFC Coin for daily login
      await creditWallet(userId, AF_COINS_EARN.DAILY_LOGIN_STREAK, "DAILY_LOGIN", "Daily App Login Bonus ☀️");
      return { credited: true, amount: AF_COINS_EARN.DAILY_LOGIN_STREAK };
    }

    return { credited: false };
  } catch (error) {
    console.error("autoGrantDailyLoginBonus error:", error);
    return { credited: false };
  }
}
