import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import SalesAssignmentFilters from "@/components/sales/SalesAssignmentFilters";
import SalesAssignmentCard from "@/components/sales/SalesAssignmentCard";
import SalesTerritoryMap, {
  TerritoryInstitute,
  TerritoryArea,
} from "@/components/maps/SalesTerritoryMap";
import {
  ClipboardList,
  Building2,
  Map,
  List,
} from "lucide-react";
import Link from "next/link";

export default async function SalesAssignmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const statusFilter = typeof sp.status === "string" ? sp.status : "";
  const categoryFilter = typeof sp.category === "string" ? sp.category : "";
  const searchFilter = typeof sp.search === "string" ? sp.search : "";
  const viewMode = typeof sp.view === "string" && sp.view === "map" ? "map" : "list";

  // Build where clause
  const whereCondition: any = { salesManagerId: id };

  if (statusFilter) {
    whereCondition.contactStatus = statusFilter;
  }

  const instituteFilter: any = {};
  if (categoryFilter) {
    instituteFilter.categories = { some: { categoryId: categoryFilter } };
  }

  if (searchFilter) {
    instituteFilter.OR = [
      { name: { contains: searchFilter, mode: "insensitive" } },
      { address: { contains: searchFilter, mode: "insensitive" } },
      { city: { name: { contains: searchFilter, mode: "insensitive" } } },
    ];
  }

  if (Object.keys(instituteFilter).length > 0) {
    whereCondition.institute = instituteFilter;
  }

  const [assignments, categories, areas] = await Promise.all([
    prisma.salesAssignment.findMany({
      where: whereCondition,
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
            categories: {
              include: { category: { select: { id: true, name: true } } },
            },
          },
        },
        salesManager: {
          select: { id: true, name: true },
        },
        areaAssignment: {
          select: { id: true, areaName: true, radiusKm: true },
        },
      },
      orderBy: [{ contactStatus: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
    }),

    // Get all categories for filter dropdown
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),

    // Get all assigned areas for circles
    prisma.salesAreaAssignment.findMany({
      where: { salesManagerId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const now = new Date();

  // Convert assignments for Map
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

  // Build query string helper for toggling view
  const makeViewUrl = (view: "list" | "map") => {
    const currentParams = new URLSearchParams();
    if (statusFilter) currentParams.set("status", statusFilter);
    if (categoryFilter) currentParams.set("category", categoryFilter);
    if (searchFilter) currentParams.set("search", searchFilter);
    currentParams.set("view", view);
    return `?${currentParams.toString()}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-full min-w-0">
      {/* Header with View Toggle Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-teal-600" /> My Assignments
          </h1>
          <p className="text-slate-500 mt-1">
            {assignments.length} institute{assignments.length !== 1 ? "s" : ""} assigned to you.
          </p>
        </div>

        {/* List / Map View Switcher Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl shrink-0 self-start sm:self-auto border border-slate-200/80">
          <Link
            href={makeViewUrl("list")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "list"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </Link>

          <Link
            href={makeViewUrl("map")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "map"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Map className="w-3.5 h-3.5 text-rose-500" />
            <span>Map View</span>
          </Link>
        </div>
      </div>

      {/* Filters (Used in both List & Map) */}
      <SalesAssignmentFilters categories={categories} />

      {/* 🗺️ MAP VIEW */}
      {viewMode === "map" ? (
        <div className="space-y-4">
          <SalesTerritoryMap
            institutes={territoryInstitutes}
            areas={territoryAreas}
            className="h-[650px]"
          />
        </div>
      ) : (
        /* 📋 LIST VIEW */
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No assignments match your filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment: any) => {
                const isOverdue =
                  assignment.deadline &&
                  new Date(assignment.deadline) < now &&
                  assignment.contactStatus !== "ONBOARDED" &&
                  assignment.contactStatus !== "UPGRADED";

                return (
                  <SalesAssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    isOverdue={Boolean(isOverdue)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
