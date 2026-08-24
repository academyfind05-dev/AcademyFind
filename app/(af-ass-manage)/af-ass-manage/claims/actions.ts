"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteClaimAction(id: string) {
    try {
        await prisma.instituteClaim.delete({
            where: { id }
        });
        revalidatePath("/af-ass-manage/claims");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting claim:", error);
        return { success: false, error: "Failed to delete claim" };
    }
}
