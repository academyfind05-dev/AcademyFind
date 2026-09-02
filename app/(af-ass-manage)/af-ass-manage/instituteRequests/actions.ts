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

export async function updateInstituteRequestStatus(id: string, status: string, notes: string | null) {
    try {
        await prisma.instituteRequest.update({
            where: { id },
            data: { 
                status,
                adminNotes: notes
            }
        });
        revalidatePath("/af-ass-manage/instituteRequests");
        revalidatePath(`/af-ass-manage/instituteRequests/${id}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating institute request:", error);
        return { success: false, error: "Failed to update institute request" };
    }
}
