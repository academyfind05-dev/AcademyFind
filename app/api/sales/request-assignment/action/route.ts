import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/getSession";
import { notifyUser } from "@/lib/notifications/notify";

// Helper: Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, action, adminRemark, deadline, includeReassign } = body;

    if (!requestId || !action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Request ID and valid action (APPROVE or REJECT) are required" }, { status: 400 });
    }

    const requestItem = await prisma.salesAssignmentRequest.findUnique({
      where: { id: requestId },
      include: {
        institute: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        salesManager: { select: { id: true, name: true, email: true, phone: true } }
      }
    });

    if (!requestItem) {
      return NextResponse.json({ error: "Assignment request not found" }, { status: 404 });
    }

    if (requestItem.status !== "PENDING") {
      return NextResponse.json({ error: `Request is already ${requestItem.status.toLowerCase()}` }, { status: 400 });
    }

    const smId = requestItem.salesManagerId;
    const deadlineDate = deadline ? new Date(deadline) : null;
    let assignmentResult: any = null;

    if (action === "APPROVE") {
      if (requestItem.type === "INSTITUTE") {
        if (!requestItem.instituteId) {
          return NextResponse.json({ error: "Request is missing institute ID" }, { status: 400 });
        }

        assignmentResult = await prisma.salesAssignment.upsert({
          where: { instituteId: requestItem.instituteId },
          update: {
            salesManagerId: smId,
            deadline: deadlineDate,
            contactStatus: "NOT_CONTACTED"
          },
          create: {
            salesManagerId: smId,
            instituteId: requestItem.instituteId,
            deadline: deadlineDate,
            contactStatus: "NOT_CONTACTED"
          }
        });
      } else if (requestItem.type === "AREA") {
        const lat = requestItem.latitude;
        const lng = requestItem.longitude;
        const radiusKm = requestItem.radiusKm || 3;
        const areaName = requestItem.areaName || "Assigned Area";

        if (lat === null || lng === null) {
          return NextResponse.json({ error: "Request is missing area coordinates" }, { status: 400 });
        }

        // 1. Create SalesAreaAssignment
        const areaAssignment = await prisma.salesAreaAssignment.create({
          data: {
            salesManagerId: smId,
            areaName,
            latitude: lat,
            longitude: lng,
            radiusKm,
            deadline: deadlineDate
          }
        });

        // 2. Query institutes in area
        const institutesWithCoords = await prisma.institute.findMany({
          where: { latitude: { not: null }, longitude: { not: null }, isActive: true },
          select: {
            id: true,
            latitude: true,
            longitude: true,
            salesAssignments: { select: { salesManagerId: true } }
          }
        });

        const inRadius = institutesWithCoords.filter(
          (i) => haversineKm(lat, lng, i.latitude!, i.longitude!) <= radiusKm
        );

        const addressMatches: any[] = areaName
          ? await prisma.institute.findMany({
              where: {
                isActive: true,
                OR: [{ latitude: null }, { longitude: null }],
                address: { contains: areaName, mode: "insensitive" }
              },
              select: {
                id: true,
                salesAssignments: { select: { salesManagerId: true } }
              }
            })
          : [];

        const seen = new Set(inRadius.map((i) => i.id));
        const allCandidates = [
          ...inRadius,
          ...addressMatches.filter((i) => !seen.has(i.id))
        ];

        let assignedCount = 0;
        for (const inst of allCandidates) {
          const existing = (inst as any).salesAssignments;
          if (!existing || existing.salesManagerId === smId || includeReassign) {
            await prisma.salesAssignment.upsert({
              where: { instituteId: inst.id },
              update: {
                salesManagerId: smId,
                areaAssignmentId: areaAssignment.id,
                deadline: deadlineDate
              },
              create: {
                salesManagerId: smId,
                instituteId: inst.id,
                areaAssignmentId: areaAssignment.id,
                deadline: deadlineDate
              }
            });
            assignedCount++;
          }
        }

        assignmentResult = { areaAssignment, assignedCount };
      } else if (requestItem.type === "CATEGORY") {
        if (!requestItem.categoryId) {
          return NextResponse.json({ error: "Request is missing category ID" }, { status: 400 });
        }

        assignmentResult = await prisma.salesCategoryAssignment.upsert({
          where: {
            salesManagerId_categoryId: {
              salesManagerId: smId,
              categoryId: requestItem.categoryId
            }
          },
          update: {
            deadline: deadlineDate
          },
          create: {
            salesManagerId: smId,
            categoryId: requestItem.categoryId,
            deadline: deadlineDate
          }
        });
      }

      // Update Request status to APPROVED
      const updatedRequest = await prisma.salesAssignmentRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          adminRemark: adminRemark?.trim() || null,
          reviewedById: session.user.id,
          reviewedAt: new Date()
        }
      });

      // Target Label
      let targetLabel = "";
      if (requestItem.type === "INSTITUTE") targetLabel = `Institute "${requestItem.institute?.name}"`;
      else if (requestItem.type === "AREA") targetLabel = `Area "${requestItem.areaName}"`;
      else if (requestItem.type === "CATEGORY") targetLabel = `Category "${requestItem.category?.name}"`;

      // Notify Sales Manager
      await notifyUser(
        smId,
        "ASSIGNMENT_ASSIGNED" as any,
        "🎉 Assignment Request Approved!",
        `Your request for ${targetLabel} has been approved by Admin.${adminRemark ? ` Remark: "${adminRemark}"` : ""}`,
        requestItem.id
      );

      return NextResponse.json({
        success: true,
        data: updatedRequest,
        assignment: assignmentResult,
        message: `Request approved successfully. ${targetLabel} has been assigned to ${requestItem.salesManager.name}.`
      });
    } else {
      // Action: REJECT
      const updatedRequest = await prisma.salesAssignmentRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          adminRemark: adminRemark?.trim() || null,
          reviewedById: session.user.id,
          reviewedAt: new Date()
        }
      });

      let targetLabel = "";
      if (requestItem.type === "INSTITUTE") targetLabel = `Institute "${requestItem.institute?.name}"`;
      else if (requestItem.type === "AREA") targetLabel = `Area "${requestItem.areaName}"`;
      else if (requestItem.type === "CATEGORY") targetLabel = `Category "${requestItem.category?.name}"`;

      // Notify Sales Manager
      await notifyUser(
        smId,
        "ASSIGNMENT_ASSIGNED" as any,
        "❌ Assignment Request Rejected",
        `Your request for ${targetLabel} was declined.${adminRemark ? ` Reason: "${adminRemark}"` : ""}`,
        requestItem.id
      );

      return NextResponse.json({
        success: true,
        data: updatedRequest,
        message: `Request has been rejected.`
      });
    }
  } catch (error: any) {
    console.error("Error processing assignment request action:", error);
    return NextResponse.json({ error: error.message || "Failed to process action" }, { status: 500 });
  }
}
