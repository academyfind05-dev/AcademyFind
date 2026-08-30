"use server";

import { prisma } from "@/lib/prisma"; // Apne prisma client ka path check kar lena
import { revalidatePath } from "next/cache";
import { notifyAdminsPush } from "@/lib/pushNotifications";
import {
  CLAIM_PENDING_STATUS,
} from "@/lib/institutes/institute-workflow";
import { checkRateLimit } from "@/lib/rate-limit";

export async function submitClaimRequest(formData: FormData) {
  try {
    // Apply Rate Limiting: Max 3 claims per 5 minutes per IP
    const rateLimit = await checkRateLimit("submitClaimRequest", 3, 5 * 60 * 1000);
    if (!rateLimit.success) {
      return { success: false, error: rateLimit.message };
    }

    // Form se data nikalna
    const instituteId = formData.get("instituteId") as string;
    const userId = formData.get("userId") as string;
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const role = formData.get("role") as string;
    const message = formData.get("message") as string;

    // Basic validation
    if (!instituteId || !userId || !fullName || !email || !phone || !role) {
      return { success: false, error: "Please fill all required fields." };
    }

    const [user, institute, existingManager] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      prisma.institute.findUnique({ where: { id: instituteId }, select: { id: true, name: true } }),
      prisma.instituteManager.findFirst({ where: { instituteId } }),
    ]);

    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (!institute) {
      return { success: false, error: "Institute not found." };
    }

    if (existingManager) {
      return { success: false, error: "This institute already has a verified manager." };
    }

    // Check agar user ne pehle se claim request daali hui hai (Pending state me)
    const existingClaim = await prisma.instituteClaim.findFirst({
      where: {
        instituteId: instituteId,
        userId: userId,
        status: CLAIM_PENDING_STATUS,
      },
    });

    if (existingClaim) {
      return { success: false, error: "You already have a pending claim request for this institute." };
    }

    // Database me nayi claim request save karna
    const claim = await prisma.instituteClaim.create({
      data: {
        instituteId,
        userId,
        fullName,
        email,
        phone,
        role,
        message,
        status: CLAIM_PENDING_STATUS, // By default PENDING jayega admin approval ke liye
      },
    });

    await prisma.adminNotification.create({
      data: {
        type: "NEW_INSTITUTE_CLAIM",
        title: "New Institute Claim Request",
        message: `${fullName} (${phone}) requested to claim ownership of institute: ${institute.name}`,
      },
    });

    notifyAdminsPush({
      title: "🏫 New Institute Claim Request!",
      body: `${fullName} requested to claim ${institute.name}`,
      data: { screen: '(admin)/claims' }
    });

    // 🔔 Notify Sales Manager if assigned
    try {
      const { notifySalesManagerOnInstituteClaim } = await import("@/lib/notifications/salesNotifications");
      await notifySalesManagerOnInstituteClaim({
        instituteId,
        instituteName: institute.name,
        ownerName: fullName,
      });
    } catch (e) {
      console.error("Sales claim notify error:", e);
    }

    // Institute page aur admin queue ko revalidate karna taaki cache clear ho jaye
    revalidatePath(`/institute/${instituteId}`);
    revalidatePath("/institute/[idSlug]");
    revalidatePath("/af-ass-manage/claims");
    revalidatePath("/af-ass-manage");
    
    return { success: true };
  } catch (error) {
    console.error("Error submitting claim request:", error);
    return { success: false, error: "Internal server error. Please try again later." };
  }
}