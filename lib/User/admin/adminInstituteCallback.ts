"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Status update karna
export async function updateCallbackStatus(id: string, status: string) {
  try {
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