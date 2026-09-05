"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/getSession";
import { notifyAdmins, notifyUser } from "@/lib/notifications/notify";

// 1. Assign Callback to Sales Manager
export async function assignCallbackToSalesManager(id: string, salesManagerId: string | null) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Only Admins can assign enquiries to Sales Managers." };
    }

    const enquiry = await prisma.instituteEnquiry.findUnique({
      where: { id },
      include: { institute: { select: { name: true } } },
    });

    if (!enquiry) return { success: false, error: "Enquiry not found." };

    await prisma.instituteEnquiry.update({
      where: { id },
      data: {
        assignedSalesManagerId: salesManagerId || null,
        lastUpdatedByRole: "ADMIN",
        lastUpdatedByName: session.user.name || "Admin",
      },
    });

    // Notify the Sales Manager if assigned
    if (salesManagerId) {
      const salesManager = await prisma.user.findUnique({
        where: { id: salesManagerId },
        select: { id: true, name: true },
      });

      if (salesManager) {
        await notifyUser(
          salesManagerId,
          "SYSTEM" as any,
          "🎯 New Student Enquiry Assigned",
          `Admin assigned you a student enquiry from ${enquiry.name} for ${enquiry.institute?.name || "the institute"}.`,
          id,
        );
      }
    }

    revalidatePath("/af-ass-manage/instituteCallbacks");
    revalidatePath(`/af-ass-manage/instituteCallbacks/${id}`);
    if (salesManagerId) {
      revalidatePath(`/af-ass-manage/sales_manager/${salesManagerId}`);
      revalidatePath(`/sales_manager/${salesManagerId}`);
      revalidatePath(`/sales_manager/${salesManagerId}/enquiries`);
      revalidatePath(`/sales_manager/${salesManagerId}/enquiries/${id}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error assigning sales manager:", error);
    return { success: false, error: "Failed to assign Sales Manager." };
  }
}

// 2. Status update (Institute Status) with attribution & cross-notifications
export async function updateCallbackStatus(id: string, status: string) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized." };
    }

    const userRole = session.user.role;
    const userName = session.user.name || (userRole === "ADMIN" ? "Admin" : "Sales Manager");

    const existing = await prisma.instituteEnquiry.findUnique({
      where: { id },
      include: { institute: { select: { name: true } } },
    });

    if (!existing) return { success: false, error: "Enquiry not found." };

    if (existing.status !== status) {
      await prisma.enquiryStatusHistory.create({
        data: {
          enquiryId: id,
          oldStatus: existing.status,
          newStatus: status,
          statusType: "INSTITUTE",
          updatedByRole: userRole,
          updatedByName: userName,
        },
      });
    }

    await prisma.instituteEnquiry.update({
      where: { id },
      data: {
        status,
        lastUpdatedByRole: userRole,
        lastUpdatedByName: userName,
      },
    });

    // 🔔 Cross Notifications
    if (userRole === "SALES_MANAGER") {
      // Notify Admin that Sales Manager updated the status
      await notifyAdmins(
        "CALLBACK",
        "⚡ Enquiry Status Updated by Sales Manager",
        `${userName} updated status of enquiry for ${existing.institute?.name || "Institute"} to ${status}.`,
        `/af-ass-manage/instituteCallbacks/${id}`,
        id,
      );
    } else if (userRole === "ADMIN" && existing.assignedSalesManagerId) {
      // Notify assigned Sales Manager that Admin updated the status
      await notifyUser(
        existing.assignedSalesManagerId,
        "SYSTEM" as any,
        "⚡ Assigned Enquiry Status Updated",
        `Admin updated status of your assigned enquiry for ${existing.institute?.name || "Institute"} to ${status}.`,
        id,
      );
    }

    revalidatePath("/af-ass-manage/instituteCallbacks");
    revalidatePath(`/af-ass-manage/instituteCallbacks/${id}`);
    if (existing.assignedSalesManagerId) {
      revalidatePath(`/sales_manager/${existing.assignedSalesManagerId}/enquiries`);
      revalidatePath(`/sales_manager/${existing.assignedSalesManagerId}/enquiries/${id}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "Failed to update status." };
  }
}

// 3. User contact status update (Student Status) with attribution & cross-notifications
export async function updateUserContactStatus(id: string, userContactStatus: string) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized." };
    }

    const userRole = session.user.role;
    const userName = session.user.name || (userRole === "ADMIN" ? "Admin" : "Sales Manager");

    const existing = await prisma.instituteEnquiry.findUnique({
      where: { id },
      include: { institute: { select: { name: true } } },
    });

    if (!existing) return { success: false, error: "Enquiry not found." };

    if (existing.userContactStatus !== userContactStatus) {
      await prisma.enquiryStatusHistory.create({
        data: {
          enquiryId: id,
          oldStatus: existing.userContactStatus,
          newStatus: userContactStatus,
          statusType: "STUDENT",
          updatedByRole: userRole,
          updatedByName: userName,
        },
      });
    }

    await prisma.instituteEnquiry.update({
      where: { id },
      data: {
        userContactStatus,
        lastUpdatedByRole: userRole,
        lastUpdatedByName: userName,
      },
    });

    // 🔔 Cross Notifications
    if (userRole === "SALES_MANAGER") {
      await notifyAdmins(
        "CALLBACK",
        "⚡ Student Contact Status Updated by Sales Manager",
        `${userName} updated student status of enquiry for ${existing.institute?.name || "Institute"} to ${userContactStatus}.`,
        `/af-ass-manage/instituteCallbacks/${id}`,
        id,
      );
    } else if (userRole === "ADMIN" && existing.assignedSalesManagerId) {
      await notifyUser(
        existing.assignedSalesManagerId,
        "SYSTEM" as any,
        "⚡ Assigned Student Status Updated",
        `Admin updated student status of your assigned enquiry for ${existing.institute?.name || "Institute"} to ${userContactStatus}.`,
        id,
      );
    }

    revalidatePath("/af-ass-manage/instituteCallbacks");
    revalidatePath(`/af-ass-manage/instituteCallbacks/${id}`);
    if (existing.assignedSalesManagerId) {
      revalidatePath(`/sales_manager/${existing.assignedSalesManagerId}/enquiries`);
      revalidatePath(`/sales_manager/${existing.assignedSalesManagerId}/enquiries/${id}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating user contact status:", error);
    return { success: false, error: "Failed to update user contact status." };
  }
}

// 4. Admin note update
export async function updateCallbackAdminNote(id: string, adminNote: string) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Only Admins can edit the Admin note." };
    }

    const enquiry = await prisma.instituteEnquiry.findUnique({
      where: { id },
      include: { institute: { select: { name: true } } },
    });

    if (!enquiry) return { success: false, error: "Enquiry not found." };

    await prisma.instituteEnquiry.update({
      where: { id },
      data: { adminNote },
    });

    // Notify assigned sales manager if any
    if (enquiry.assignedSalesManagerId) {
      await notifyUser(
        enquiry.assignedSalesManagerId,
        "SYSTEM" as any,
        "📝 Admin Note Added",
        `Admin updated note on your assigned enquiry for ${enquiry.institute?.name || "the institute"}.`,
        id,
      );
    }

    revalidatePath("/af-ass-manage/instituteCallbacks");
    revalidatePath(`/af-ass-manage/instituteCallbacks/${id}`);
    if (enquiry.assignedSalesManagerId) {
      revalidatePath(`/sales_manager/${enquiry.assignedSalesManagerId}/enquiries`);
      revalidatePath(`/sales_manager/${enquiry.assignedSalesManagerId}/enquiries/${id}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating admin note:", error);
    return { success: false, error: "Failed to update admin note." };
  }
}

// 5. Sales Manager note update
export async function updateCallbackSalesManagerNote(id: string, salesManagerNote: string) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized." };
    }

    const enquiry = await prisma.instituteEnquiry.findUnique({
      where: { id },
      include: { institute: { select: { name: true } } },
    });

    if (!enquiry) return { success: false, error: "Enquiry not found." };

    // Allow the assigned sales manager or an admin to edit
    if (session.user.role !== "ADMIN" && enquiry.assignedSalesManagerId !== session.user.id) {
      return { success: false, error: "You are not assigned to this enquiry." };
    }

    await prisma.instituteEnquiry.update({
      where: { id },
      data: { salesManagerNote },
    });

    // If edited by Sales Manager, notify Admin
    if (session.user.role === "SALES_MANAGER") {
      await notifyAdmins(
        "CALLBACK",
        "📝 Sales Manager Note Updated",
        `${session.user.name || "Sales Manager"} added/updated note on enquiry for ${enquiry.institute?.name || "the institute"}.`,
        `/af-ass-manage/instituteCallbacks/${id}`,
        id,
      );
    }

    revalidatePath("/af-ass-manage/instituteCallbacks");
    revalidatePath(`/af-ass-manage/instituteCallbacks/${id}`);
    if (enquiry.assignedSalesManagerId) {
      revalidatePath(`/sales_manager/${enquiry.assignedSalesManagerId}/enquiries`);
      revalidatePath(`/sales_manager/${enquiry.assignedSalesManagerId}/enquiries/${id}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating sales manager note:", error);
    return { success: false, error: "Failed to update sales manager note." };
  }
}

// 6. Callback delete (Restricted to Admin only)
export async function deleteCallback(id: string) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Forbidden: Only Admins are allowed to delete enquiries." };
    }

    await prisma.instituteEnquiry.delete({
      where: { id },
    });

    revalidatePath("/af-ass-manage/instituteCallbacks");
    return { success: true };
  } catch (error) {
    console.error("Error deleting callback:", error);
    return { success: false, error: "Failed to delete callback." };
  }
}