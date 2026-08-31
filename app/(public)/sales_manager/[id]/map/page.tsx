import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MapPin, Route, Building2 } from "lucide-react";
import SalesTerritoryMap, {
  TerritoryInstitute,
  TerritoryArea,
} from "@/components/maps/SalesTerritoryMap";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Territory Map & Field Route Planner | Sales Manager",
  robots: { index: false, follow: false },
};

export default async function SalesManagerMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Only the sales manager themselves or an admin can access
  if (session.user.role !== "ADMIN" && session.user.id !== id) {
    redirect("/login");
  }

  // Fetch assigned institutes and assigned areas
  const [assignments, areas] = await Promise.all([
    prisma.salesAssignment.findMany({
      where: { salesManagerId: id },
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            email: true,
            address: true,
            latitude: true,
            longitude: true,
            city: { select: { name: true } },
            categories: { select: { category: { select: { name: true } } }, take: 1 },
          },
        },
        areaAssignment: {
          select: {
            id: true,
            areaName: true,
            radiusKm: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.salesAreaAssignment.findMany({
      where: { salesManagerId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Format into TerritoryInstitute objects
  const territoryInstitutes: TerritoryInstitute[] = assignments.map((a: any) => ({
    assignmentId: a.id,
    instituteId: a.institute.id,
    name: a.institute.name,
    slug: a.institute.slug,
    phone: a.institute.phone,
    email: a.institute.email,
    address: a.institute.address,
    city: a.institute.city?.name,
    category: a.institute.categories?.[0]?.category?.name,
    latitude: a.institute.latitude,
    longitude: a.institute.longitude,
    contactStatus: a.contactStatus,
    interest: a.interest,
    remark: a.remark,
    onboardedPlan: a.onboardedPlan,
    deadline: a.deadline,
    areaAssignmentId: a.areaAssignmentId,
    areaName: a.areaAssignment?.areaName,
  }));

  const territoryAreas: TerritoryArea[] = areas.map((ar: any) => ({
    id: ar.id,
    areaName: ar.areaName,
    latitude: ar.latitude,
    longitude: ar.longitude,
    radiusKm: ar.radiusKm,
    deadline: ar.deadline,
  }));

  const geocodedCount = territoryInstitutes.filter((i) => i.latitude !== null && i.longitude !== null).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-full min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-2xl">
              <MapPin className="w-6 h-6" />
            </div>
            Territory Map & Field Planner
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visual territory planning: Locate institutes, inspect coverage radius, plan daily field visits, and start navigation.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-100 px-3.5 py-2 rounded-2xl text-xs font-bold text-stone-700">
          <span>📍 {geocodedCount} of {territoryInstitutes.length} Mapped</span>
        </div>
      </div>

      {/* Territory Map */}
      <SalesTerritoryMap
        institutes={territoryInstitutes}
        areas={territoryAreas}
        className="h-[680px]"
      />
    </div>
  );
}
