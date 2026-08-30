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
        const q = searchParams.get("q")?.trim();
        const instituteId = searchParams.get("instituteId");

        if (!q) {
            return NextResponse.json({ users: [] });
        }

        const users = await prisma.user.findMany({
            where: {
                id: { not: session.user.id },
                OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { username: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                    { phone: { contains: q, mode: "insensitive" } }
                ]
            },
            take: 20,
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phone: true,
                image: true,
                role: true,
            }
        });

        if (!instituteId) {
            return NextResponse.json({ users });
        }

        // Add member / invite status if instituteId is provided
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
