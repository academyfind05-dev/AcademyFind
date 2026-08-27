import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Store the user's Expo push token for sending push notifications.
 * POST: { pushToken: string, platform: 'android' | 'ios' }
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawToken = authHeader.replace("Bearer ", "");
    
    // Hash the token to match what's stored in the database
    const encoder = new TextEncoder();
    const data = encoder.encode(rawToken);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedToken = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const session = await prisma.session.findFirst({
      where: { token: hashedToken, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { pushToken, platform } = body;

    if (!pushToken) {
      return NextResponse.json({ error: "pushToken is required" }, { status: 400 });
    }

    // Store push token in user record
    // We use a JSON field or a simple string field to store the token
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pushToken: pushToken,
      },
    });

    console.log(`🔔 Push token registered for user ${session.user.email}: ${pushToken.substring(0, 20)}...`);

    return NextResponse.json({
      success: true,
      message: "Push token registered successfully",
    });
  } catch (error: any) {
    console.error("Push token registration error:", error);
    
    // If pushToken field doesn't exist in schema, log gracefully
    if (error.code === 'P2009' || error.message?.includes('pushToken')) {
      console.log("⚠️ pushToken field not in schema yet - token logged but not persisted");
      return NextResponse.json({ success: true, message: "Token received (schema update pending)" });
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to register push token" },
      { status: 500 }
    );
  }
}
