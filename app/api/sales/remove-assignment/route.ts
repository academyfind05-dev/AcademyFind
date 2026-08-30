import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { assignmentId, type } = body;

        if (!assignmentId || !type) {
            return NextResponse.json(
                { error: "assignmentId and type ('institute' or 'category') are required" },
                { status: 400 }
            );
        }

        if (type === "institute") {
            await prisma.salesAssignment.delete({
                where: { id: assignmentId }
            });
        } else if (type === "category") {
            await prisma.salesCategoryAssignment.delete({
                where: { id: assignmentId }
            });
        } else if (type === "area") {
            await prisma.salesAreaAssignment.delete({
                where: { id: assignmentId }
            });
        } else {
            return NextResponse.json({ error: "Invalid type. Must be 'institute', 'category', or 'area'" }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error removing assignment:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
