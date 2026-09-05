import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/getSession";

export async function getMobileUserId(request?: NextRequest): Promise<string | null> {
  try {
    const authHeader = request?.headers.get("authorization");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const rawToken = authHeader.substring(7).trim();
      
      // Compute SHA-256 hash of the bearer token
      const encoder = new TextEncoder();
      const data = encoder.encode(rawToken);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedToken = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      // Find session by hashed token (or raw token as fallback)
      const sessionObj = await prisma.session.findFirst({
        where: {
          OR: [
            { token: hashedToken },
            { token: rawToken },
          ],
          expiresAt: { gt: new Date() },
        },
        select: { userId: true },
      });

      if (sessionObj?.userId) {
        return sessionObj.userId;
      }
    }

    // Fallback to getSession()
    const session = await getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error("Error in getMobileUserId:", error);
    return null;
  }
}
