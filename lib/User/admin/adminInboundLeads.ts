"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

async function verifyAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function updateInboundLeadStatus(leadId: string, status: string) {
  try {
    await verifyAdmin();

    const updated = await prisma.inboundLead.update({
      where: { id: leadId },
      data: { status },
    });

    revalidatePath("/af-ass-manage/lead-integrations");
    return { success: true, lead: updated };
  } catch (error: any) {
    console.error("Error updating inbound lead status:", error);
    return { success: false, error: error.message || "Failed to update status" };
  }
}

export async function updateInboundLeadNotes(leadId: string, notes: string) {
  try {
    await verifyAdmin();

    const updated = await prisma.inboundLead.update({
      where: { id: leadId },
      data: { notes },
    });

    revalidatePath("/af-ass-manage/lead-integrations");
    return { success: true, lead: updated };
  } catch (error: any) {
    console.error("Error updating inbound lead notes:", error);
    return { success: false, error: error.message || "Failed to update notes" };
  }
}

export async function deleteInboundLead(leadId: string) {
  try {
    await verifyAdmin();

    await prisma.inboundLead.delete({
      where: { id: leadId },
    });

    revalidatePath("/af-ass-manage/lead-integrations");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting inbound lead:", error);
    return { success: false, error: error.message || "Failed to delete lead" };
  }
}
