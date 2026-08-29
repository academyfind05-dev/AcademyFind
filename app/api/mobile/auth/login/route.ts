import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers as nextHeaders } from "next/headers";
import { prisma } from "@/lib/prisma";
import { autoGrantDailyLoginBonus } from "@/lib/wallet/auto-daily-login";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Use Better Auth's internal API to sign in
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: await nextHeaders(),
    });

    if ("user" in response && response.user?.id) {
      // Better auth hashes the token in DB, so we must manually create a session to get the raw token
      const rawToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const encoder = new TextEncoder();
      const data = encoder.encode(rawToken);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedToken = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      await prisma.session.create({
        data: {
          id: crypto.randomUUID(),
          token: hashedToken,
          userId: response.user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: request.headers.get("user-agent") || "Mobile App"
        }
      });

      // Auto-grant daily login coins
      try {
        await autoGrantDailyLoginBonus(response.user.id);
      } catch (e) {
        console.error("Daily login bonus error:", e);
      }

      return NextResponse.json({ ...response, token: rawToken });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 401 }
    );
  }
}
