import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const getSession = cache(async () => {
  try {
    const reqHeaders = await headers();
    
    // Check for mobile Bearer token first
    const authHeader = reqHeaders.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const rawToken = authHeader.substring(7);
      
      // Hash the token the same way it was created in login/signup
      const encoder = new TextEncoder();
      const data = encoder.encode(rawToken);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedToken = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      
      const session = await prisma.session.findFirst({
        where: { token: hashedToken },
        include: { user: true }
      });
      
      if (session && session.expiresAt > new Date()) {
        return { session, user: session.user };
      }
    }
    
    // Fallback to standard Better Auth session (web cookies)
    return await auth.api.getSession({ headers: reqHeaders });
  } catch (error) {
    console.error("Session fetch error:", error);
    return null;
  }
});
