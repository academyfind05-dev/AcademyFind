"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { syncSingleInstituteToMeili } from '@/scripts/SyncInstitute';
import { meili } from "@/lib/meilisearch";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function approveInstituteRequest(requestId: string) {
    try {
        const request = await prisma.instituteRequest.findUnique({
            where: { id: requestId },
            include: { institute: true, user: { select: { email: true, name: true } } }
        });

        if (!request) return { success: false, error: "Request record not found." };
        if (request.status !== "PENDING") {
            return { success: false, error: `Request already ${request.status.toLowerCase()}.` };
        }

        const transactionOperations: any[] = [
            prisma.institute.update({
                where: { id: request.instituteId },
                data: {
                    isActive: true,
                    isPublished: true,
                    subscriptionPlan: "BASIC",
                    planWeight: 1
                }
            }),
            prisma.instituteRequest.update({
                where: { id: requestId },
                data: { status: "APPROVED" }
            }),
            prisma.user.update({
                where: { id: request.userId },
                data: {
                    canAddInstitute: true,
                    role: "INSTITUTE_MANAGER"
                }
            }),
            prisma.instituteManager.upsert({
                where: {
                    userId_instituteId: {
                        userId: request.userId,
                        instituteId: request.instituteId
                    }
                },
                update: {},
                create: {
                    userId: request.userId,
                    instituteId: request.instituteId
                }
            }),
            prisma.instituteMembership.upsert({
                where: {
                    userId_instituteId_role: {
                        userId: request.userId,
                        instituteId: request.instituteId,
                        role: 'MANAGER'
                    }
                },
                create: {
                    userId: request.userId,
                    instituteId: request.instituteId,
                    role: 'MANAGER',
                    status: 'ACTIVE',
                    joinedAt: new Date(),
                    isActive: true
                },
                update: {
                    status: 'ACTIVE',
                    joinedAt: new Date(),
                    isActive: true
                }
            })
        ];

        // DB Transaction execute karein
        await prisma.$transaction(transactionOperations);

        // Also ensure institute channels exist and add manager
        const { addMemberToInstituteChannels } = await import("@/lib/chat/ensureInstituteChannels");
        await addMemberToInstituteChannels(request.userId, request.instituteId, "MANAGER");

        console.log(`Institute ${request.instituteId} approved, Syncing to Meilisearch...`);

        // Fix: Meilisearch task wait ko non-blocking banaya taaki server action pipeline fast respond kare
        const syncresult = await syncSingleInstituteToMeili(request.instituteId);
        if (!syncresult.success) {
            console.error("Database updated but MeiliSync Error:", syncresult.error);
        }

        revalidatePath("/af-ass-manage/instituteRequests");
        revalidatePath("/af-ass-manage");

        // 🔔 Notify Sales Manager & Admin if this institute is assigned
        try {
            const { notifySalesManagerOnInstituteClaim } = await import("@/lib/notifications/salesNotifications");
            await notifySalesManagerOnInstituteClaim({
                instituteId: request.instituteId,
                instituteName: request.institute.name,
                ownerName: request.user?.name || request.ownerName || undefined,
            });
        } catch (e) {
            console.error("Sales manager claim notification error:", e);
        }

        // Send Email to the Manager
        if (request.user?.email) {
            try {
                await resend.emails.send({
                    from: "AcademyFind <no-reply@academyfind.com>", // Replace with your verified sender domain if different
                    to: request.user.email,
                    subject: "Your Institute Listing has been Approved! 🎉",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <h2 style="color: #f59e0b;">Congratulations, ${request.user.name || 'Manager'}!</h2>
                            <p>Your request to list <strong>${request.institute.name}</strong> on AcademyFind has been approved by our admin team.</p>
                            <p>Your listing is now live and visible to students.</p>
                            
                            <div style="margin: 30px 0; padding: 20px; background-color: #fcf9f2; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                <h3 style="margin-top: 0; color: #b45309;">Next Steps</h3>
                                <p>You can now manage your institute's profile, respond to reviews, and view analytics directly from your Manager Dashboard.</p>
                                <p style="color: #b45309; font-weight: bold;">⚠️ Important: Please make sure to log in using the exact same email address (${request.user.email}) that you used to submit this listing, otherwise you won't be able to access your manager dashboard.</p>
                                <a href="https://academyfind.com/manager" style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Go to Manager Dashboard</a>
                            </div>
                            
                            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
                            <br/>
                            <p>Best Regards,<br/><strong>The AcademyFind Team</strong></p>
                        </div>
                    `
                });
                console.log(`Approval email sent to ${request.user.email}`);
            } catch (emailError) {
                console.error("Failed to send approval email:", emailError);
                // We don't fail the entire process if just the email fails
            }
        }

        return { success: true, message: "Institute Approved & Assigned to Manager (Basic Plan)!" };
    } catch (error) {
        console.error("Approval action error:", error);
        return { success: false, error: "Approval pipeline failed." };
    }
}

export async function rejectInstituteRequest(requestId: string) {
    try {
        const request = await prisma.instituteRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) return { success: false, error: "Request not found." };
        if (request.status !== "PENDING") {
            return { success: false, error: `Request already ${request.status.toLowerCase()}.` };
        }

        await prisma.$transaction([
            prisma.instituteRequest.update({
                where: { id: requestId },
                data: { status: "REJECTED" }
            }),
            prisma.user.update({
                where: { id: request.userId },
                data: { canAddInstitute: true }
            })
        ]);

        try {
            const index = meili.index("global_search");
            const documentId = `inst-${request.instituteId}`;
            // Background cleanup bina product blocking ke
            await index.deleteDocument(documentId);
            console.log(`🗑️ Sent remove request for unapproved institute ${documentId} to Meilisearch.`);
        } catch (meiliError) {
            console.error("Failed to delete rejected institute from Meilisearch:", meiliError);
        }

        revalidatePath("/af-ass-manage/instituteRequests");
        revalidatePath("/af-ass-manage");
        return { success: true, message: "Request rejected successfully." };
    } catch (error) {
        console.error("Rejection action error:", error);
        return { success: false, error: "Rejection pipeline failed." };
    }
}
