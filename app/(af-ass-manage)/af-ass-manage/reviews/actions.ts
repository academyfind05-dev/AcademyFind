"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteReviewAction(id: string) {
    try {
        await prisma.review.delete({
            where: { id }
        });
        revalidatePath("/af-ass-manage/reviews");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting review:", error);
        return { success: false, error: "Failed to delete review" };
    }
}

export async function deleteReplyAction(id: string) {
    try {
        await prisma.reviewReply.delete({
            where: { id }
        });
        revalidatePath("/af-ass-manage/reviews");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting reply:", error);
        return { success: false, error: "Failed to delete reply" };
    }
}
