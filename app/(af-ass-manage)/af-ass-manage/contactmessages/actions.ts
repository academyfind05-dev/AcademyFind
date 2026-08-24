"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteContactMessageAction(id: string) {
    try {
        await prisma.contactMessage.delete({
            where: { id }
        });
        revalidatePath("/af-ass-manage/contactmessages");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting contact message:", error);
        return { success: false, error: "Failed to delete contact message" };
    }
}
