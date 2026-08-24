"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteInstituteRequestAction(id: string) {
    try {
        await prisma.instituteRequest.delete({
            where: { id }
        });
        revalidatePath("/af-ass-manage/instituteRequests");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting institute request:", error);
        return { success: false, error: "Failed to delete institute request" };
    }
}
