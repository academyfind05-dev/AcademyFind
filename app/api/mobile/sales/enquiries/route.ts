import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const salesManagerId = searchParams.get("salesManagerId");
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || "";

    // Access check
    if (session.user.role !== "ADMIN" && salesManagerId && session.user.id !== salesManagerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const whereCondition: any = {
      isForwarded: false,
    };

    if (session.user.role === "ADMIN") {
      if (salesManagerId && salesManagerId !== "ALL") {
        whereCondition.assignedSalesManagerId = salesManagerId;
      } else {
        // Admin views all enquiries assigned to sales managers
        whereCondition.assignedSalesManagerId = { not: null };
      }
    } else {
      whereCondition.assignedSalesManagerId = session.user.id;
    }

    if (status !== "ALL") {
      whereCondition.status = status;
    }

    if (search.trim()) {
      whereCondition.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { phone: { contains: search.trim() } },
        { institute: { name: { contains: search.trim(), mode: "insensitive" } } },
      ];
    }

    const enquiries = await prisma.instituteEnquiry.findMany({
      where: whereCondition,
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            phone: true,
            slug: true,
          },
        },
        assignedSalesManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, enquiries });
  } catch (error: any) {
    console.error("Error fetching mobile sales enquiries:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch enquiries" }, { status: 500 });
  }
}
