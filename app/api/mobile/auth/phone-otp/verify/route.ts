import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { phoneOtpStore } from "../send/route";

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "AIzaSyCJVo2m1ic_xT4BLDELw6h63mOjO9PqquE";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, name, email: userProvidedEmail } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: "Phone number and OTP are required" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
    const storedRecord = phoneOtpStore.get(cleanPhone);

    let isValidOtp = false;

    // 1. Dev Bypass for rapid testing
    if (otp === "123456") {
      isValidOtp = true;
    }

    // 2. Check Firebase verification if sessionInfo exists
    if (!isValidOtp && storedRecord?.sessionInfo) {
      try {
        const fbRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${FIREBASE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionInfo: storedRecord.sessionInfo,
              code: otp,
            }),
          }
        );
        const fbData = await fbRes.json();
        if (fbData.idToken || fbData.phoneNumber) {
          isValidOtp = true;
          console.log(`🔥 [FIREBASE OTP VERIFIED] ${cleanPhone}`);
        } else {
          console.warn("Firebase OTP verify failed:", fbData);
        }
      } catch (fbErr) {
        console.error("Firebase OTP verify error:", fbErr);
      }
    }

    // 3. Check local OTP store if not yet verified
    if (!isValidOtp && storedRecord) {
      if (storedRecord.otp === otp && Date.now() < storedRecord.expiresAt) {
        isValidOtp = true;
      }
    }

    if (!isValidOtp) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Clear OTP after successful match
    phoneOtpStore.delete(cleanPhone);

    const fallbackEmail = `user_${cleanPhone}@phone.academyfind.com`;
    const finalEmail = (userProvidedEmail && userProvidedEmail.includes("@")) ? userProvidedEmail.trim().toLowerCase() : fallbackEmail;

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
      // Update name or real email if missing/default
      const updateData: any = {};
      if (name && (!user.name || user.name.startsWith("User "))) updateData.name = name.trim();
      if (userProvidedEmail && userProvidedEmail.includes("@") && user.email.includes("@phone.academyfind.com")) updateData.email = userProvidedEmail.trim().toLowerCase();
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    // Generate Mobile Bearer Token
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

    return NextResponse.json({
      success: true,
      user,
      token: rawToken,
      session: { token: rawToken }
    });

  } catch (error: any) {
    console.error("Verify Phone OTP Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "OTP verification failed" },
      { status: 500 }
    );
  }
}
