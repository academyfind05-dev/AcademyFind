"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function getInboundIntegrations(instituteId: string) {
  try {
    const integrations = await prisma.inboundLeadIntegration.findMany({
      where: { instituteId },
      orderBy: { createdAt: "desc" },
    });
    return integrations;
  } catch (error) {
    console.error("Error fetching inbound integrations:", error);
    return [];
  }
}

export async function createInboundIntegration(data: {
  instituteId: string;
  provider: "META" | "GOOGLE" | "WEBSITE_WEBHOOK" | "ZAPIER" | "LINKEDIN";
  name?: string;
  config?: any;
}) {
  try {
    const institute = await prisma.institute.findUnique({
      where: { id: data.instituteId },
      select: { subscriptionPlan: true },
    });

    const isPremium =
      institute?.subscriptionPlan === "PREMIUM" ||
      institute?.subscriptionPlan === "ULTRA";

    if (!isPremium) {
      return {
        success: false,
        error: "Inbound lead integrations require an active Premium or Ultra subscription.",
      };
    }

    const randomSuffix = crypto.randomBytes(16).toString("hex");
    const apiKey = `af_${data.provider.toLowerCase()}_${randomSuffix}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://academyfind.com";
    const webhookUrl = `${baseUrl}/api/webhooks/leads/inbound/${apiKey}`;

    const integration = await prisma.inboundLeadIntegration.create({
      data: {
        instituteId: data.instituteId,
        provider: data.provider,
        name: data.name || `${data.provider} Lead Campaign`,
        apiKey,
        webhookUrl,
        config: data.config || {},
        isActive: true,
      },
    });

    revalidatePath(`/manager/${data.instituteId}/integrations`);
    return { success: true, integration };
  } catch (error: any) {
    console.error("Error creating inbound integration:", error);
    return { success: false, error: error.message || "Failed to create integration" };
  }
}

export async function updateInboundIntegration(
  id: string,
  instituteId: string,
  data: {
    name?: string;
    isActive?: boolean;
    config?: any;
  }
) {
  try {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.config !== undefined) updateData.config = data.config;

    const updated = await prisma.inboundLeadIntegration.update({
      where: { id },
      data: updateData,
    });

    revalidatePath(`/manager/${instituteId}/integrations`);
    return { success: true, integration: updated };
  } catch (error: any) {
    console.error("Error updating inbound integration:", error);
    return { success: false, error: error.message || "Failed to update integration" };
  }
}

export async function deleteInboundIntegration(id: string, instituteId: string) {
  try {
    await prisma.inboundLeadIntegration.delete({
      where: { id },
    });

    revalidatePath(`/manager/${instituteId}/integrations`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting inbound integration:", error);
    return { success: false, error: error.message || "Failed to delete integration" };
  }
}

export async function regenerateInboundApiKey(id: string, instituteId: string) {
  try {
    const integration = await prisma.inboundLeadIntegration.findUnique({
      where: { id },
    });

    if (!integration) {
      return { success: false, error: "Integration not found" };
    }

    const randomSuffix = crypto.randomBytes(16).toString("hex");
    const newApiKey = `af_${integration.provider.toLowerCase()}_${randomSuffix}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://academyfind.com";
    const newWebhookUrl = `${baseUrl}/api/webhooks/leads/inbound/${newApiKey}`;

    const updated = await prisma.inboundLeadIntegration.update({
      where: { id },
      data: {
        apiKey: newApiKey,
        webhookUrl: newWebhookUrl,
      },
    });

    revalidatePath(`/manager/${instituteId}/integrations`);
    return { success: true, integration: updated };
  } catch (error: any) {
    console.error("Error regenerating API key:", error);
    return { success: false, error: error.message || "Failed to regenerate API key" };
  }
}

export async function simulateTestLead(id: string, instituteId: string) {
  try {
    const integration = await prisma.inboundLeadIntegration.findUnique({
      where: { id },
      include: { institute: { select: { id: true, name: true } } },
    });

    if (!integration) {
      return { success: false, error: "Integration not found" };
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const mockNames = ["Rohan Verma", "Priya Singh", "Amit Patel", "Ananya Sharma", "Vikram Reddy"];
    const mockCourses = ["JEE Advanced Prep", "NEET Medical Coaching", "Foundation Batch", "Spoken English & IELTS", "UPSC Civil Services"];
    const mockName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const mockCourse = mockCourses[Math.floor(Math.random() * mockCourses.length)];
    const mockPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
    const mockEmail = `${mockName.toLowerCase().replace(/\s+/g, ".")}${randomNum}@gmail.com`;

    let sourceStr = "EXTERNAL_WEBHOOK";
    switch (integration.provider) {
      case "META":
        sourceStr = "META_ADS";
        break;
      case "GOOGLE":
        sourceStr = "GOOGLE_ADS";
        break;
      case "WEBSITE_WEBHOOK":
        sourceStr = "WEBSITE_WEBHOOK";
        break;
      case "ZAPIER":
        sourceStr = "ZAPIER";
        break;
      case "LINKEDIN":
        sourceStr = "LINKEDIN";
        break;
    }

    const enquiry = await prisma.instituteEnquiry.create({
      data: {
        instituteId,
        name: `[Test Lead] ${mockName}`,
        phone: mockPhone,
        email: mockEmail,
        message: `Inquired for: ${mockCourse} · Simulated test lead via ${integration.provider} integration (${integration.name || "Default Campaign"})`,
        source: sourceStr,
        sourceDetails: {
          isSimulation: true,
          provider: integration.provider,
          integrationId: integration.id,
          campaign: integration.name || "Test Campaign",
          simulatedAt: new Date().toISOString(),
        },
        status: "NEW",
        userContactStatus: "NEW",
      },
    });

    await prisma.inboundLeadIntegration.update({
      where: { id },
      data: {
        totalLeadsReceived: { increment: 1 },
        lastLeadAt: new Date(),
      },
    });

    revalidatePath(`/manager/${instituteId}/integrations`);
    revalidatePath(`/manager/${instituteId}/leads`);

    return {
      success: true,
      leadId: enquiry.id,
      leadName: mockName,
      leadPhone: mockPhone,
      message: `Test lead successfully sent! Check your Student Leads tab to view it.`,
    };
  } catch (error: any) {
    console.error("Error simulating test lead:", error);
    return { success: false, error: error.message || "Failed to simulate test lead" };
  }
}
