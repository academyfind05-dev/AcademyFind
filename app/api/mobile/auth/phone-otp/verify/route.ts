import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lazy Firebase Admin init to prevent module-level crashes on Vercel
async function getFirebaseAdminAuth() {
  try {
    const { getApps, initializeApp, cert } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');

    if (!getApps().length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(`Firebase env vars missing: project=${!!projectId}, email=${!!clientEmail}, key=${!!privateKey}`);
      }

      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
      console.log("✅ Firebase Admin initialized inside route");
    }

    return getAuth();
  } catch (err: any) {
    console.error("🔴 Firebase Admin init failed:", err.message);
    throw new Error("Firebase Admin initialization failed: " + err.message);
  }
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

    // Lazy-init Firebase Admin
    const adminAuth = await getFirebaseAdminAuth();

    let decodedToken;
    let cleanPhone = "";

    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);

      if (!decodedToken.phone_number) {
        throw new Error("Phone number is missing in the verified token.");
      }

      cleanPhone = decodedToken.phone_number.replace(/[^0-9]/g, "").slice(-10);
      console.log(`✅ [FIREBASE ADMIN VERIFIED] User: ${cleanPhone}`);

    } catch (firebaseError: any) {
      console.error("Firebase verifyIdToken error:", firebaseError.message);
      return NextResponse.json(
        { success: false, error: "Invalid or expired Firebase session: " + firebaseError.message },
        { status: 401 }
      );
    }

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

    // Generate Mobile Bearer Token
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

    return NextResponse.json({
      success: true,
      user,
      token: rawToken,
      session: { token: rawToken }
    });

  } catch (error: any) {
    console.error("🔴 Verify Phone OTP Error:", error.message);
    console.error("🔴 Stack:", error.stack);
    return NextResponse.json(
      { success: false, error: error.message || "OTP verification failed" },
      { status: 500 }
    );
  }
}
