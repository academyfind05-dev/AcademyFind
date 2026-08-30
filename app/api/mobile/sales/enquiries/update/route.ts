import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";
import { notifyAdmins, notifyUser } from "@/lib/notifications/notify";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, userContactStatus, salesManagerNote } = body;

    if (!id) {
      return NextResponse.json({ error: "Enquiry ID is required" }, { status: 400 });
    }

    const enquiry = await prisma.instituteEnquiry.findUnique({
      where: { id },
      include: { institute: { select: { name: true } } },
    });

    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    // Security check: Only Admin or the Assigned Sales Manager can update
    if (session.user.role !== "ADMIN" && enquiry.assignedSalesManagerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this enquiry" }, { status: 403 });
    }

    const userRole = session.user.role;
    const userName = session.user.name || (userRole === "ADMIN" ? "Admin" : "Sales Manager");

    const updateData: any = {
      lastUpdatedByRole: userRole,
      lastUpdatedByName: userName,
    };

    // 1. Institute Status change
    if (status && status !== enquiry.status) {
      updateData.status = status;
      await prisma.enquiryStatusHistory.create({
        data: {
          enquiryId: id,
          oldStatus: enquiry.status,
          newStatus: status,
          statusType: "INSTITUTE",
          updatedByRole: userRole,
          updatedByName: userName,
        },
      });

      if (userRole === "SALES_MANAGER") {
        await notifyAdmins(
          "CALLBACK",
          "⚡ Enquiry Status Updated by Sales Manager",
          `${userName} updated status of enquiry for ${enquiry.institute?.name || "Institute"} to ${status}.`,
          `/af-ass-manage/instituteCallbacks/${id}`,
          id,
        );
      } else if (userRole === "ADMIN" && enquiry.assignedSalesManagerId) {
        await notifyUser(
          enquiry.assignedSalesManagerId,
          "SYSTEM" as any,
          "⚡ Assigned Enquiry Status Updated",
          `Admin updated status of your assigned enquiry for ${enquiry.institute?.name || "Institute"} to ${status}.`,
          id,
        );
      }
    }

    // 2. Student Contact Status change
    if (userContactStatus && userContactStatus !== enquiry.userContactStatus) {
      updateData.userContactStatus = userContactStatus;
      await prisma.enquiryStatusHistory.create({
        data: {
          enquiryId: id,
          oldStatus: enquiry.userContactStatus,
          newStatus: userContactStatus,
          statusType: "STUDENT",
          updatedByRole: userRole,
          updatedByName: userName,
        },
      });

      if (userRole === "SALES_MANAGER") {
        await notifyAdmins(
          "CALLBACK",
          "⚡ Student Contact Status Updated by Sales Manager",
          `${userName} updated student status of enquiry for ${enquiry.institute?.name || "Institute"} to ${userContactStatus}.`,
          `/af-ass-manage/instituteCallbacks/${id}`,
          id,
        );
      } else if (userRole === "ADMIN" && enquiry.assignedSalesManagerId) {
        await notifyUser(
          enquiry.assignedSalesManagerId,
          "SYSTEM" as any,
          "⚡ Assigned Student Status Updated",
          `Admin updated student status of your assigned enquiry for ${enquiry.institute?.name || "Institute"} to ${userContactStatus}.`,
          id,
        );
      }
    }

    // 3. Sales Manager Note update
    if (typeof salesManagerNote === "string" && salesManagerNote !== enquiry.salesManagerNote) {
      updateData.salesManagerNote = salesManagerNote;
      if (userRole === "SALES_MANAGER") {
        await notifyAdmins(
          "CALLBACK",
          "📝 Sales Manager Note Updated",
          `${userName} updated note on enquiry for ${enquiry.institute?.name || "the institute"}.`,
          `/af-ass-manage/instituteCallbacks/${id}`,
          id,
        );
      }
    }

    const updatedEnquiry = await prisma.instituteEnquiry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, enquiry: updatedEnquiry });
  } catch (error: any) {
    console.error("Error updating mobile enquiry:", error);
    return NextResponse.json({ error: error.message || "Failed to update enquiry" }, { status: 500 });
  }
}
