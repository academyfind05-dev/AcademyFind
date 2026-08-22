import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers as nextHeaders } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, provider } = body;

    if (!idToken || !provider) {
      return NextResponse.json(
        { error: "idToken and provider are required" },
        { status: 400 }
      );
    }

    // Use Better Auth's internal API for social sign-in
    const response = await auth.api.signInSocial({
      body: { idToken, provider },
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

      return NextResponse.json({ ...response, token: rawToken });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Mobile social login error:", error);
    return NextResponse.json(
      { error: error.message || "Social login failed" },
      { status: 401 }
    );
  }
}
