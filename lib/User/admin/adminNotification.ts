"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/getSession";

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
        const session = await getSession();
        const userId = session?.user?.id;

        await prisma.adminNotification.updateMany({
            where: { ...(userId ? { userId } : {}), isRead: false },
            data: { isRead: true }
        });
        
        revalidatePath("/af-ass-manage/notifications");
    } catch (error) {
        console.error("Failed to mark all as read:", error);
    }
}