import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications/notify";
import { notifyAdminsPush } from "@/lib/pushNotifications";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "SALES_MANAGER" && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { assignmentId, contactStatus, interest, remark, onboardedPlan } = body;

        if (!assignmentId || !contactStatus) {
            return NextResponse.json({ error: "assignmentId and contactStatus are required" }, { status: 400 });
        }

        // Verify the assignment belongs to this sales manager (unless admin)
        const assignment = await prisma.salesAssignment.findUnique({
            where: { id: assignmentId }
        });

        if (!assignment) {
            return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
        }

        if (session.user.role === "SALES_MANAGER" && assignment.salesManagerId !== session.user.id) {
            return NextResponse.json({ error: "You can only update your own assignments" }, { status: 403 });
        }

        // Build update data
        const updateData: any = {
            contactStatus,
            remark: remark || null,
        };

        if (contactStatus === "CONTACTED") {
            updateData.interest = interest || null;
            updateData.contactedAt = assignment.contactedAt || new Date();
            // Clear onboarded fields if moving back
            updateData.onboardedPlan = null;
            updateData.onboardedAt = null;
        } else if (contactStatus === "IN_PROCESS") {
            updateData.interest = interest || null;
            updateData.contactedAt = assignment.contactedAt || new Date();
            // Clear onboarded fields
            updateData.onboardedPlan = null;
            updateData.onboardedAt = null;
        } else if (contactStatus === "ONBOARDED") {
            updateData.interest = "INTERESTED";
            updateData.onboardedPlan = onboardedPlan || null;
            updateData.onboardedAt = assignment.onboardedAt || new Date();
            if (!assignment.contactedAt) {
                updateData.contactedAt = new Date();
            }
        } else if (contactStatus === "NOT_CONTACTED") {
            updateData.interest = null;
            updateData.contactedAt = null;
            updateData.onboardedAt = null;
            updateData.onboardedPlan = null;
        }

        const updated = await prisma.salesAssignment.update({
            where: { id: assignmentId },
            data: updateData,
            include: {
                institute: { select: { name: true } },
                salesManager: { select: { id: true, name: true, email: true } },
            }
        });

        // 🔔 Notify Admins about the assignment status update
        const managerName = updated.salesManager?.name || session.user.name || "Sales Manager";
        const instName = updated.institute?.name || "Institute";
        const statusDisplay = contactStatus === "ONBOARDED" ? `ONBOARDED (${onboardedPlan || 'PREMIUM'})` : contactStatus;

        notifyAdmins(
            "SALES_ASSIGNMENT_UPDATE",
            `Sales Assignment Updated: ${instName}`,
            `${managerName} updated status to "${statusDisplay}" for ${instName}.${remark ? ` Remark: "${remark}"` : ""}`,
            `/af-ass-manage/sales_manager/${updated.salesManagerId}`,
            updated.id
        ).catch(e => console.error("Admin notification error:", e));

        notifyAdminsPush({
            title: `Sales Update: ${instName}`,
            body: `${managerName} updated status to "${statusDisplay}"${remark ? ` - ${remark}` : ""}`,
            data: { screen: '(admin)/sales' }
        });

        return NextResponse.json({ success: true, assignment: updated });

    } catch (error) {
        console.error("Error updating sales status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
