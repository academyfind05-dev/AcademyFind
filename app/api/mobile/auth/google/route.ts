import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers as nextHeaders } from "next/headers";

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

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Mobile social login error:", error);
    return NextResponse.json(
      { error: error.message || "Social login failed" },
      { status: 401 }
    );
  }
}
