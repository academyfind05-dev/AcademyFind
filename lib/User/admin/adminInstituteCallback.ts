"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Status update karna
export async function updateCallbackStatus(id: string, status: string) {
  try {
    const existing = await prisma.instituteEnquiry.findUnique({ where: { id }, select: { status: true } });
    
    if (existing && existing.status !== status) {
      await prisma.enquiryStatusHistory.create({
        data: {
          enquiryId: id,
          oldStatus: existing.status,
          newStatus: status,
          statusType: "INSTITUTE"
        }
      });
    }

    await prisma.instituteEnquiry.update({
      where: { id },
      data: { status }
    });
    
    // Pages ko revalidate karo taaki naya data dikhe
    revalidatePath("/af-ass-manage/instituteCallbacks");
    revalidatePath(`/af-ass-manage/instituteCallbacks/${id}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "Failed to update status." };
  }
}

// User contact status update karna
export async function updateUserContactStatus(id: string, userContactStatus: string) {
  try {
    const existing = await prisma.instituteEnquiry.findUnique({ where: { id }, select: { userContactStatus: true } });
    
    if (existing && existing.userContactStatus !== userContactStatus) {
      await prisma.enquiryStatusHistory.create({
        data: {
          enquiryId: id,
          oldStatus: existing.userContactStatus,
          newStatus: userContactStatus,
          statusType: "STUDENT"
        }
      });
    }

    await prisma.instituteEnquiry.update({
      where: { id },
      data: { userContactStatus }
    });
    
    revalidatePath("/af-ass-manage/instituteCallbacks");
    revalidatePath(`/af-ass-manage/instituteCallbacks/${id}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user contact status:", error);
    return { success: false, error: "Failed to update user contact status." };
  }
}

// Admin note update karna
export async function updateCallbackAdminNote(id: string, adminNote: string) {
  try {
    await prisma.instituteEnquiry.update({
      where: { id },
      data: { adminNote }
    });
    
    revalidatePath("/af-ass-manage/instituteCallbacks");
    revalidatePath(`/af-ass-manage/instituteCallbacks/${id}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error updating admin note:", error);
    return { success: false, error: "Failed to update admin note." };
  }
}

// Callback delete karna
export async function deleteCallback(id: string) {
  try {
    await prisma.instituteEnquiry.delete({
      where: { id }
    });
    
    revalidatePath("/af-ass-manage/instituteCallbacks");
    return { success: true };
  } catch (error) {
    console.error("Error deleting callback:", error);
    return { success: false, error: "Failed to delete callback." };
  }
}