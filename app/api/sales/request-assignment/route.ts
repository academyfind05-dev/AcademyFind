import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/getSession";
import { notifyAdmins } from "@/lib/notifications/notify";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "SALES_MANAGER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Sales Managers can submit assignment requests" }, { status: 403 });
    }

    const body = await req.json();
    const {
      type,
      instituteId,
      areaName,
      latitude,
      longitude,
      radiusKm,
      categoryId,
      reason,
      salesManagerId: overrideSmId
    } = body;

    // Use session user ID or override if admin is creating on behalf of SM
    const targetSmId = (role === "ADMIN" && overrideSmId) ? overrideSmId : session.user.id;

    if (!type || !["INSTITUTE", "AREA", "CATEGORY"].includes(type)) {
      return NextResponse.json({ error: "Invalid request type. Must be INSTITUTE, AREA, or CATEGORY." }, { status: 400 });
    }

    if (type === "INSTITUTE" && !instituteId) {
      return NextResponse.json({ error: "Institute ID is required for INSTITUTE request" }, { status: 400 });
    }

    if (type === "AREA" && (!areaName || latitude === undefined || longitude === undefined)) {
      return NextResponse.json({ error: "Area Name, Latitude, and Longitude are required for AREA request" }, { status: 400 });
    }

    if (type === "CATEGORY" && !categoryId) {
      return NextResponse.json({ error: "Category ID is required for CATEGORY request" }, { status: 400 });
    }

    const smUser = await prisma.user.findUnique({
      where: { id: targetSmId },
      select: { id: true, name: true, email: true, phone: true }
    });

    if (!smUser) {
      return NextResponse.json({ error: "Sales Manager not found" }, { status: 404 });
    }

    // Check for duplicate pending request
    const existingPending = await prisma.salesAssignmentRequest.findFirst({
      where: {
        salesManagerId: targetSmId,
        type,
        status: "PENDING",
        ...(type === "INSTITUTE" ? { instituteId } : {}),
        ...(type === "CATEGORY" ? { categoryId } : {}),
        ...(type === "AREA" ? { areaName } : {})
      }
    });

    if (existingPending) {
      return NextResponse.json({
        error: "You already have a pending request for this target. Please wait for admin review."
      }, { status: 409 });
    }

    const newRequest = await prisma.salesAssignmentRequest.create({
      data: {
        salesManagerId: targetSmId,
        type,
        status: "PENDING",
        instituteId: type === "INSTITUTE" ? instituteId : null,
        areaName: type === "AREA" ? areaName : null,
        latitude: type === "AREA" ? parseFloat(latitude) : null,
        longitude: type === "AREA" ? parseFloat(longitude) : null,
        radiusKm: type === "AREA" ? (parseFloat(radiusKm) || 3) : null,
        categoryId: type === "CATEGORY" ? categoryId : null,
        reason: reason?.trim() || null
      },
      include: {
        institute: { select: { id: true, name: true, slug: true, address: true, logo: true } },
        category: { select: { id: true, name: true, slug: true } },
        salesManager: { select: { id: true, name: true, email: true } }
      }
    });

    // Determine target name for notification
    let targetLabel = "";
    if (type === "INSTITUTE") targetLabel = `Institute "${newRequest.institute?.name || instituteId}"`;
    else if (type === "AREA") targetLabel = `Area "${areaName}" (${radiusKm || 3} km radius)`;
    else if (type === "CATEGORY") targetLabel = `Category "${newRequest.category?.name || categoryId}"`;

    // Notify all Admins immediately
    await notifyAdmins(
      "SALES_ASSIGNMENT_REQUEST",
      "⚡ New Assignment Request",
      `${smUser.name || "Sales Manager"} requested ${targetLabel}.${reason ? ` Reason: "${reason}"` : ""}`,
      "/af-ass-manage/sales_requests",
      newRequest.id
    );

    return NextResponse.json({
      success: true,
      data: newRequest,
      message: "Assignment request submitted successfully and sent to Admin for approval."
    });
  } catch (error: any) {
    console.error("Error creating assignment request:", error);
    return NextResponse.json({ error: error.message || "Failed to create assignment request" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED, ALL
    const type = searchParams.get("type"); // INSTITUTE, AREA, CATEGORY, ALL
    const salesManagerId = searchParams.get("salesManagerId");

    const role = session.user.role;
    const isSalesManager = role === "SALES_MANAGER";

    const where: any = {};

    if (isSalesManager) {
      where.salesManagerId = session.user.id;
    } else if (salesManagerId && salesManagerId !== "ALL") {
      where.salesManagerId = salesManagerId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    const requests = await prisma.salesAssignmentRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            logo: true,
            city: { select: { name: true } },
            categories: { select: { category: { select: { name: true } } }, take: 2 }
          }
        },
        category: { select: { id: true, name: true, slug: true } },
        salesManager: { select: { id: true, name: true, email: true, phone: true, image: true } },
        reviewedBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error: any) {
    console.error("Error fetching assignment requests:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch assignment requests" }, { status: 500 });
  }
}
