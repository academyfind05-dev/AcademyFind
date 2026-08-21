"use server"
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateLifeCoachStatus(id: string, newStatus: "PENDING" | "CONTACTED" | "MESSAGED" | "CALLED" | "RESOLVED" | "JUNK" | "DNP", notes?: string) {
    try {
        await prisma.lifeCoachRequest.update({
            where: { id },
            data: { 
                status: newStatus,
                ...(notes !== undefined ? { notes } : {})
            }
        });
        
        revalidatePath("/af-ass-manage/life-coach");
        revalidatePath(`/af-ass-manage/life-coach/${id}`);
        return { success: true, message: "Updated successfully!" };
    } catch (error) {
        console.error("Update Error:", error);
        return { success: false, error: "Failed to update." };
    }
}