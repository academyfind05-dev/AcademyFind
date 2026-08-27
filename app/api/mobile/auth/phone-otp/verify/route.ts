import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { phoneOtpStore } from "../send/route";

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyCIUcTKaK5iGLCXxNNTz74SMhPaKtE33-o";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, name } = body;

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

    const email = `user_${cleanPhone}@phone.academyfind.com`;
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: `+91${cleanPhone}` },
          { email }
        ]
      }
    });

    if (!user) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const userName = name || `User ${cleanPhone.slice(-4)}`;
      const username = `user_${cleanPhone}_${randomSuffix}`;

      user = await prisma.user.create({
        data: {
          name: userName,
          email,
          phone: cleanPhone,
          username,
          emailVerified: true
        }
      });
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
