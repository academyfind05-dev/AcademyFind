"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteUserAction(id: string) {
    try {
        await prisma.user.delete({
            where: { id }
        });
        revalidatePath("/af-ass-manage/users");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, error: "Failed to delete user" };
    }
}
