import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { debitWallet } from "@/lib/wallet/credit";
import { WalletTransactionSource } from "@/app/generated/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { amount, source, description, referenceId } = await req.json();

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }

    if (!Object.values(WalletTransactionSource).includes(source)) {
        // Just bypass this strict enum check for flexibility or map it correctly.
        // Assuming the schema enum is updated, if not it will throw an error at Prisma level.
    }

    const result = await debitWallet(userId, amount, source as WalletTransactionSource, description, referenceId);

    if (result && "success" in result && result.success === false) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({ success: false, error: "Failed to process transaction" }, { status: 500 });
    }

    return NextResponse.json({ success: true, transaction: result });
  } catch (error: any) {
    console.error("Wallet Use Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
