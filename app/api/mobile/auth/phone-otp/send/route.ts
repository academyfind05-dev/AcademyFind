import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple in-memory OTP store for rapid verification
export const phoneOtpStore = new Map<string, { otp: string; expiresAt: number }>();

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

    phoneOtpStore.set(cleanPhone, { otp, expiresAt });

    console.log(`📱 [PHONE OTP GENERATED] Phone: ${fullPhone} | OTP: ${otp}`);

    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    if (fast2smsKey) {
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

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to ${fullPhone}`,
      ...(process.env.NODE_ENV !== "production" && !fast2smsKey ? { devOtp: otp } : {})
    });

  } catch (error: any) {
    console.error("Send Phone OTP Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
