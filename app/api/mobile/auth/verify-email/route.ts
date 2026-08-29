import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers as nextHeaders } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // 1. Call Better Auth's internal API to verify the email OTP
    const response = await auth.api.verifyEmailOTP({
      body: { email, otp },
      headers: await nextHeaders(),
    });

    if (response?.status) {
      // 2. Email successfully verified. Now we create a Mobile Session Token.
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        throw new Error("User not found after verification");
      }

      // 3. Generate Mobile Bearer Token
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
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: request.headers.get("user-agent") || "Mobile App"
        }
      });

      return NextResponse.json({ success: true, token: rawToken, user });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Mobile Verify Email Error:", error);
    return NextResponse.json(
      { error: error.message || "Email verification failed. Invalid or expired OTP." },
      { status: 401 }
    );
  }
}
