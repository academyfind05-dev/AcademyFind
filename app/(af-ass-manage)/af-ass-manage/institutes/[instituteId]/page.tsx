import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AdminInstituteDashboardClient } from "./AdminInstituteDashboardClient";

export default async function AdminInstituteDashboard({ params }: { params: Promise<{ instituteId: string }> }) {
    const { instituteId } = await params;

    const institute = await prisma.institute.findUnique({
        where: { id: instituteId },
        include: {
            city: true,
            categories: { include: { category: true } },
            managers: { include: { user: true } },
            _count: {
                select: {
                    managers: true,
                    reviews: true,
                    batches: true,
                    studentRecords: true,
                    teacherRecords: true,
                    enquiries: true,
                    claims: true,
                    viewHistory: true,
                    shortlistedBy: true,
                    dailyViews: true,
                    achievements: true,
                    faqs: true,
                    crmIntegrations: true
                }
            },
            viewHistory: { take: 5, orderBy: { viewedAt: 'desc' }, include: { user: true } },
            shortlistedBy: { take: 5, orderBy: { createdAt: 'desc' }, include: { user: true } },
            dailyViews: { take: 30, orderBy: { date: 'asc' } },
            crmIntegrations: true,
            teacherRecords: {
                include: {
                    membership: { include: { user: true } }
                }
            },
            batches: true,
            faqs: true,
            achievements: true,
            notablepersons: true,
            enquiries: {
                where: { isForwarded: false },
                take: 1,
                orderBy: { createdAt: 'desc' }
            },
        }
    });

    if (!institute) return notFound();

    // Fetch Detailed Analytics Data for Admin
    const visits = await prisma.instituteVisit.findMany({
        where: { instituteId },
        select: { city: true, deviceType: true, duration: true }
    });

    const avgDuration = visits.length > 0
        ? Math.round(visits.reduce((acc: number, curr: { duration: number; }) => acc + curr.duration, 0) / visits.length)
        : 0;

    const deviceMap: Record<string, number> = {};
    const cityMap: Record<string, number> = {};

    visits.forEach((v: any) => {
        const dev = v.deviceType || "Unknown";
        deviceMap[dev] = (deviceMap[dev] || 0) + 1;

        const city = v.city || "Unknown";
        cityMap[city] = (cityMap[city] || 0) + 1;
    });

    const deviceData = Object.keys(deviceMap).map(k => ({ name: k, value: deviceMap[k] }));
    const cityData = Object.keys(cityMap)
        .map((k: any) => ({ name: k, value: cityMap[k] }))
        .sort((a: { value: number; }, b: { value: number; }) => b.value - a.value);

    const analyticsData = {
        deviceData,
        cityData,
        avgDuration
    };

    return (
        <AdminInstituteDashboardClient institute={institute} analyticsData={analyticsData} />
    );
}
