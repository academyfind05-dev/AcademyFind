"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteAdvertisementAction(id: string) {
    try {
        await prisma.advertisement.delete({
            where: { id }
        });
        revalidatePath("/af-ass-manage/advertisements");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting advertisement:", error);
        return { success: false, error: "Failed to delete advertisement" };
    }
}
