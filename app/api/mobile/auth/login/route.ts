import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers as nextHeaders } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Use Better Auth's internal API to sign in
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: await nextHeaders(),
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 401 }
    );
  }
}
