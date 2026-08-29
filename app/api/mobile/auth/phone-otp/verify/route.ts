import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoGrantDailyLoginBonus } from "@/lib/wallet/auto-daily-login";

// Verify Firebase ID Token using REST API (no firebase-admin needed!)
async function verifyFirebaseIdToken(idToken: string) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new Error("FIREBASE_WEB_API_KEY env var is missing");

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  const json = await res.json();

  if (!res.ok || !json.users || json.users.length === 0) {
    console.error("Firebase token lookup failed:", json);
    throw new Error(json.error?.message || "Invalid or expired Firebase token");
  }

  return json.users[0]; // { localId, phoneNumber, email, emailVerified, ... }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, name, email: userProvidedEmail } = body;

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Firebase ID Token is required" },
        { status: 400 }
      );
    }

    // 1. Verify Firebase token via REST API
    let firebaseUser: any;
    try {
      firebaseUser = await verifyFirebaseIdToken(idToken);
    } catch (err: any) {
      console.error("Firebase token verification error:", err.message);
      return NextResponse.json(
        { success: false, error: "Invalid or expired Firebase session: " + err.message },
        { status: 401 }
      );
    }

    const rawPhone: string = firebaseUser.phoneNumber || "";
    if (!rawPhone) {
      return NextResponse.json(
        { success: false, error: "Phone number not found in Firebase token" },
        { status: 400 }
      );
    }

    const cleanPhone = rawPhone.replace(/[^0-9]/g, "").slice(-10);
    console.log(`✅ [FIREBASE VERIFIED] Phone: ${cleanPhone}`);

    // 2. Find or create user in DB
    const fallbackEmail = `user_${cleanPhone}@phone.academyfind.com`;
    const finalEmail = (userProvidedEmail && userProvidedEmail.includes("@"))
      ? userProvidedEmail.trim().toLowerCase()
      : fallbackEmail;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: `+91${cleanPhone}` },
          { email: finalEmail },
          { email: fallbackEmail }
        ]
      }
    });

    if (!user) {
      const emailPrefix = finalEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const userName = name ? name.trim() : `User ${cleanPhone.slice(-4)}`;
      const username = `${emailPrefix}_${randomSuffix}`;

      console.log(`Creating new user: email=${finalEmail}, username=${username}`);
      user = await prisma.user.create({
        data: {
          name: userName,
          email: finalEmail,
          phone: cleanPhone,
          username,
          emailVerified: true
        }
      });
    } else {
      const updateData: any = {};
      if (name && (!user.name || user.name.startsWith("User "))) updateData.name = name.trim();
      if (userProvidedEmail && userProvidedEmail.includes("@") && user.email.includes("@phone.academyfind.com")) {
        updateData.email = userProvidedEmail.trim().toLowerCase();
      }
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({ where: { id: user.id }, data: updateData });
      }
    }

    // 3. Generate Mobile Bearer Token (session)
    const rawToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const encoder = new TextEncoder();
    const tokenData = encoder.encode(rawToken);
    const hashBuffer = await crypto.subtle.digest("SHA-256", tokenData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedToken = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    await prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        token: hashedToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: request.headers.get("user-agent") || "Mobile App"
      }
    });

    // Auto-grant daily login bonus coins
    try {
      await autoGrantDailyLoginBonus(user.id);
    } catch (e) {
      console.error("Daily login bonus error:", e);
    }

    return NextResponse.json({
      success: true,
      user,
      token: rawToken,
    });

  } catch (error: any) {
    console.error("🔴 Verify Phone OTP Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "OTP verification failed" },
      { status: 500 }
    );
  }
}
