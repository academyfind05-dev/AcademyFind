'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/getSession";
import { notifyUser } from "@/lib/notifications/notify";

export async function deleteCallbackAction(id: string) {
  try {
    await prisma.instituteEnquiry.delete({
      where: { id }
    });
    revalidatePath("/af-ass-manage/instituteCallbacks");
    return { success: true };
  } catch (error) {
    console.error("Error deleting callback:", error);
    return { success: false, error: "Failed to delete callback" };
  }
}

export async function updateCallbackStatusAndNote(id: string, status: string, notes: string | null) {
  try {
    const session = await getSession();
    const userRole = session?.user?.role || "ADMIN";
    const userName = session?.user?.name || "Admin";

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
        adminNote: notes,
        lastUpdatedByRole: userRole,
        lastUpdatedByName: userName,
      },
    });

    if (existing.assignedSalesManagerId) {
      await notifyUser(
        existing.assignedSalesManagerId,
        "SYSTEM" as any,
        "⚡ Enquiry Status & Notes Updated",
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
  } catch (error: any) {
    console.error("Error updating callback status & notes:", error);
    return { success: false, error: "Failed to update callback status and notes" };
  }
}

