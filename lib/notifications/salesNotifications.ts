import { prisma } from "@/lib/prisma";
import { notifyUser, notifyAdmins } from "@/lib/notifications/notify";
import { notifyUserPush, notifyAdminsPush } from "@/lib/pushNotifications";

/**
 * Notify assigned Sales Manager & Admin when an institute profile is claimed
 */
export async function notifySalesManagerOnInstituteClaim({
  instituteId,
  instituteName,
  ownerName,
}: {
  instituteId: string;
  instituteName?: string;
  ownerName?: string;
}) {
  try {
    const assignment = await prisma.salesAssignment.findUnique({
      where: { instituteId },
      include: {
        salesManager: { select: { id: true, name: true, email: true } },
        institute: { select: { name: true } },
      },
    });

    const targetInstituteName = instituteName || assignment?.institute?.name || "Your assigned institute";

    if (assignment?.salesManager) {
      const salesManager = assignment.salesManager;
      const smTitle = `🎉 Claim Alert: ${targetInstituteName}`;
      const smBody = `${ownerName || "The institute owner"} has claimed ${targetInstituteName}! Please review and update your assignment status & remarks.`;

      // 1. In-App Notification to Sales Manager
      await notifyUser(salesManager.id, "SYSTEM", smTitle, smBody, instituteId);

      // 2. Mobile Push Notification to Sales Manager
      await notifyUserPush({
        userId: salesManager.id,
        title: smTitle,
        body: smBody,
        data: { screen: "(sales)/assignments", instituteId },
      });

      // 3. Admin Notification
      await notifyAdmins(
        "INSTITUTE_CLAIM_SALES_ALERT",
        `🏢 Institute Claimed: ${targetInstituteName}`,
        `${targetInstituteName} was claimed by owner. Assigned Sales Manager: ${salesManager.name || salesManager.email}.`,
        `/af-ass-manage/sales_manager/${salesManager.id}`,
        assignment.id
      );

      await notifyAdminsPush({
        title: `🏢 Institute Claimed: ${targetInstituteName}`,
        body: `Assigned Sales Manager: ${salesManager.name || salesManager.email}`,
        data: { screen: "(admin)/sales" },
      });
    } else {
      // Unassigned institute claimed
      await notifyAdmins(
        "INSTITUTE_CLAIM_ALERT",
        `🏢 Institute Claimed: ${targetInstituteName}`,
        `${targetInstituteName} was claimed by owner. (Currently Unassigned)`,
        `/af-ass-manage/instituteRequests`,
        instituteId
      );
    }
  } catch (error) {
    console.error("notifySalesManagerOnInstituteClaim error:", error);
  }
}

/**
 * Notify assigned Sales Manager & Admin when an institute upgrades to a paid plan (VERIFIED, PREMIUM, ULTRA)
 */
export async function notifySalesManagerOnPlanUpgrade({
  instituteId,
  instituteName,
  plan,
  amountPaid,
}: {
  instituteId: string;
  instituteName?: string;
  plan: string;
  amountPaid?: number;
}) {
  try {
    const assignment = await prisma.salesAssignment.findUnique({
      where: { instituteId },
      include: {
        salesManager: { select: { id: true, name: true, email: true } },
        institute: { select: { name: true } },
      },
    });

    const targetInstituteName = instituteName || assignment?.institute?.name || "Your assigned institute";

    if (assignment?.salesManager) {
      const salesManager = assignment.salesManager;
      const smTitle = `🚀 Plan Upgrade Alert: ${targetInstituteName}`;
      const smBody = `Great news! ${targetInstituteName} upgraded to ${plan} Plan! Please update your assignment status to UPGRADED (Plan: ${plan}).`;

      // 1. In-App Notification to Sales Manager
      await notifyUser(salesManager.id, "SYSTEM", smTitle, smBody, instituteId);

      // 2. Mobile Push Notification to Sales Manager
      await notifyUserPush({
        userId: salesManager.id,
        title: smTitle,
        body: smBody,
        data: { screen: "(sales)/assignments", instituteId, plan },
      });

      // 3. Admin Notification
      await notifyAdmins(
        "SALES_PLAN_UPGRADE_ALERT",
        `💰 Plan Upgrade: ${targetInstituteName} (${plan})`,
        `${targetInstituteName} upgraded to ${plan} Plan${amountPaid ? ` (₹${amountPaid})` : ""}. Assigned Sales Manager: ${salesManager.name || salesManager.email}.`,
        `/af-ass-manage/sales_manager/${salesManager.id}`,
        assignment.id
      );

      await notifyAdminsPush({
        title: `💰 Plan Upgraded: ${targetInstituteName} (${plan})`,
        body: `Assigned Sales Manager: ${salesManager.name || salesManager.email}`,
        data: { screen: "(admin)/sales" },
      });
    }
  } catch (error) {
    console.error("notifySalesManagerOnPlanUpgrade error:", error);
  }
}
