'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteLifeCoachRequestAction(id: string) {
  try {
    await prisma.lifeCoachRequest.delete({
      where: { id }
    });
    revalidatePath("/af-ass-manage/life-coach");
    return { success: true };
  } catch (error) {
    console.error("Error deleting life coach request:", error);
    return { success: false, error: "Failed to delete request" };
  }
}
