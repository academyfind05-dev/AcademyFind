import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/getSession";

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q");
        const instituteId = searchParams.get("instituteId");

        if (!q || !instituteId) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { username: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } }
                ]
            },
            take: 10,
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                image: true
            }
        });

        // Add member / invite status
        const enrichedUsers = await Promise.all(users.map(async (u: any) => {
            const membership = await prisma.instituteMembership.findFirst({
                where: { userId: u.id, instituteId }
            });
            return {
                ...u,
                isMember: membership?.status === "ACTIVE",
                isInvited: membership?.status === "PENDING"
            };
        }));

        return NextResponse.json({ users: enrichedUsers });
    } catch (error) {
        console.error("Search users error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
