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

    let email = body.email;
    let name = body.name;
    let image = body.picture || body.image;

    if (idToken) {
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      const googleUser = await googleRes.json();
      if (googleRes.ok && googleUser.email) {
        email = googleUser.email;
        name = googleUser.name || email.split('@')[0];
        image = googleUser.picture || null;
      }
    } else if (body.accessToken) {
      const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
        headers: { Authorization: `Bearer ${body.accessToken}` }
      });
      const googleUser = await googleRes.json();
      if (googleRes.ok && googleUser.email) {
        email = googleUser.email;
        name = googleUser.name || email.split('@')[0];
        image = googleUser.picture || null;
      }
    }

    if (!email) {
      return NextResponse.json({ error: "Invalid Google authorization token or email missing" }, { status: 401 });
    }
    
    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `${email.split('@')[0].replace(/[^a-zA-Z0-9]/g, "")}${randomSuffix}`;
      user = await prisma.user.create({
        data: {
          email,
          name,
          image,
          username,
          emailVerified: googleUser.email_verified === "true" || googleUser.email_verified === true,
        }
      });
      // Optionally create an Account linking
      await prisma.account.create({
        data: {
          userId: user.id,
          providerId: "google",
          accountId: googleUser.sub,
        }
      });
    }

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
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: request.headers.get("user-agent") || "Mobile App"
      }
    });

    return NextResponse.json({ user, session: { token: rawToken }, token: rawToken });
  } catch (error: any) {
    console.error("Mobile social login error:", error);
    return NextResponse.json(
      { error: error.message || "Social login failed" },
      { status: 401 }
    );
  }
}
