import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers as nextHeaders } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // Use Better Auth's internal API to sign up
    const response = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await nextHeaders(),
    });

    if ("user" in response && response.user?.id) {
      // Return success but NO token yet, forcing the app to verify email
      return NextResponse.json({ success: true, user: response.user });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Mobile signup error:", error);
    return NextResponse.json(
      { error: error.message || "Signup failed" },
      { status: 401 }
    );
  }
}
