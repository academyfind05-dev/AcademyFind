"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteInstituteAction(id: string) {
    try {
        await prisma.institute.delete({
            where: { id }
        });
        revalidatePath("/af-ass-manage/institutes");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting institute:", error);
        return { success: false, error: "Failed to delete institute. Ensure no related records are blocking this." };
    }
}
