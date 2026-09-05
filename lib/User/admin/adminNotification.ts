"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

// Notification ko Read mark karne ka function
export async function markNotificationAsRead(notificationId: string) {
    try {
        await prisma.adminNotification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });
        
        // Page ko refresh karne ke liye taaki UI turant update ho jaye
        revalidatePath("/af-ass-manage/notifications");
        return { success: true };
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
        return { success: false, error: "Something went wrong" };
    }
}

// Saari notifications ko ek sath Read mark karne ka function
export async function markAllAsRead(formData?: FormData) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        const userId = session?.user?.id;
        if (!userId) return;

        await prisma.adminNotification.updateMany({
            where: {
                OR: [
                    { userId },
                    { userId: null }
                ],
                isRead: false
            },
            data: { isRead: true }
        });
        
        revalidatePath("/af-ass-manage/notifications");
    } catch (error) {
        console.error("Failed to mark all as read:", error);
    }
}