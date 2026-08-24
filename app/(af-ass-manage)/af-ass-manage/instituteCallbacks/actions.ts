'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
