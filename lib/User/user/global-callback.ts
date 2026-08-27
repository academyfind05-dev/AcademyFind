"use server";

import { prisma } from "@/lib/prisma";
import { notifyAdminsPush } from "@/lib/pushNotifications";

export async function requestGlobalCallback(formData: FormData) {
    try {
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;
        const sourceUrl = formData.get("sourceUrl") as string; 
        const userMessage = formData.get("message") as string;

        if (!name || !phone) {
            return { success: false, error: "Name and Phone are required." };
        }

        const messageParts = [];
        if (userMessage?.trim()) messageParts.push(userMessage.trim());
        messageParts.push(`Callback requested from page: ${sourceUrl}`);

        await prisma.lifeCoachRequest.create({
            data: {
                fullName: name,
                phone: phone,
                message: messageParts.join(" | "),
                status: "PENDING"
            }
        });

        await prisma.adminNotification.create({
            data: {
                type: "NEW_CALLBACK_REQUEST",
                title: "New Callback Request",
                message: `${name} (${phone}) requested a general callback.`,
                actionUrl: "/af-ass-manage/requests"
            }
        });

        notifyAdminsPush({
            title: "📞 New Callback Request!",
            body: `${name} (${phone}) requested a callback.`,
            data: { screen: '(admin)/requests' }
        });

        return { success: true };
    } catch (error) {
        console.error("Global Callback Error:", error);
        return { success: false, error: "Something went wrong. Please try again." };
    }
}