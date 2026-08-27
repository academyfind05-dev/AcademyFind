import { NextRequest, NextResponse } from "next/server";

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// Store phone OTP sessions: phone => { otp, sessionInfo, expiresAt }
export const phoneOtpStore = new Map<string, { otp: string; sessionInfo?: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: "Valid 10-digit mobile phone number is required" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
    const fullPhone = `+91${cleanPhone}`;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    let firebaseSessionInfo: string | undefined;

    // 1. Try Firebase Identity Toolkit API (10,000 FREE SMS / month)
    try {
      const fbRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: fullPhone,
          }),
        }
      );

      const fbData = await fbRes.json();
      if (fbData.sessionInfo) {
        firebaseSessionInfo = fbData.sessionInfo;
        console.log(`🔥 [FIREBASE SMS SENT] Sent to ${fullPhone} | SessionInfo: ${firebaseSessionInfo?.substring(0, 15)}...`);
      } else {
        console.warn("⚠️ Firebase sendVerificationCode response:", fbData);
      }
    } catch (fbErr) {
      console.error("Firebase SMS send error:", fbErr);
    }

    // 2. Try Fast2SMS if configured
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    if (fast2smsKey && !firebaseSessionInfo) {
      try {
        await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            "authorization": fast2smsKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            variables_values: otp,
            route: "otp",
            numbers: cleanPhone
          })
        });
        console.log(`✅ [SMS SENT] Fast2SMS sent OTP to ${cleanPhone}`);
      } catch (smsError) {
        console.error("Fast2SMS Error:", smsError);
      }
    }

    phoneOtpStore.set(cleanPhone, { otp, sessionInfo: firebaseSessionInfo, expiresAt });
    console.log(`📱 [PHONE OTP STORED] Phone: ${fullPhone} | Local OTP: ${otp}`);

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to ${fullPhone}`,
      firebaseSent: !!firebaseSessionInfo,
      ...(process.env.NODE_ENV !== "production" && !firebaseSessionInfo && !fast2smsKey ? { devOtp: otp } : {})
    });

  } catch (error: any) {
    console.error("Send Phone OTP Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
