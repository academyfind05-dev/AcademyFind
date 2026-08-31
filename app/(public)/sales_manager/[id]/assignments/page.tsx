import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { SalesStatusBadge, InterestBadge } from "@/components/sales/SalesStatusBadge";
import SalesStatusUpdateForm from "@/components/sales/SalesStatusUpdateForm";
import SalesAssignmentFilters from "@/components/sales/SalesAssignmentFilters";
import SalesTerritoryMap, {
  TerritoryInstitute,
  TerritoryArea,
} from "@/components/maps/SalesTerritoryMap";
import {
  ClipboardList,
  MapPin,
  CalendarDays,
  User,
  Building2,
  Phone,
  Mail,
  Map,
  List,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { formatIST, generateInstituteWhatsAppMessage, formatWhatsAppNumber } from "@/lib/utils";
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
  const expandedId = typeof sp.edit === "string" ? sp.edit : "";
  const viewMode = typeof sp.view === "string" && sp.view === "map" ? "map" : "list";

  // Build where clause
  const whereCondition: any = { salesManagerId: id };

  if (statusFilter) {
    whereCondition.contactStatus = statusFilter;
  }

  const instituteFilter: any = {};
  if (categoryFilter)
    instituteFilter.categories = { some: { categoryId: categoryFilter } };

  if (searchFilter)
    instituteFilter.name = { contains: searchFilter, mode: "insensitive" };

  if (Object.keys(instituteFilter).length > 0)
    whereCondition.institute = instituteFilter;

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
                const isExpanded = expandedId === assignment.id;

                const formattedPhone = formatWhatsAppNumber(assignment.institute?.phone);
                const waText = encodeURIComponent(
                  generateInstituteWhatsAppMessage(
                    assignment.institute?.name || "Institute",
                    assignment.institute?.slug,
                    assignment.institute?.id
                  )
                );

                return (
                  <div
                    key={assignment.id}
                    className={`border rounded-2xl overflow-hidden transition-all ${
                      isOverdue
                        ? "border-red-200 bg-red-50/30"
                        : assignment.contactStatus === "UPGRADED"
                        ? "border-violet-200 bg-violet-50/20"
                        : assignment.contactStatus === "ONBOARDED"
                        ? "border-emerald-200 bg-emerald-50/20"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg text-slate-800 truncate">
                              {assignment.institute.name}
                            </h3>
                            <SalesStatusBadge status={assignment.contactStatus} />
                            {assignment.interest && (
                              <InterestBadge interest={assignment.interest} />
                            )}
                            {isOverdue && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                Overdue
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {assignment.institute.city?.name || "N/A"}
                            </span>
                            {assignment.institute.categories?.[0] && (
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                                {assignment.institute.categories[0].category.name}
                              </span>
                            )}
                            {assignment.deadline && (
                              <span
                                className={`flex items-center gap-1 ${
                                  isOverdue ? "text-red-600 font-bold" : ""
                                }`}
                              >
                                <CalendarDays className="w-3 h-3" />
                                Deadline: {formatIST(assignment.deadline, "MMM dd, yyyy")}
                              </span>
                            )}
                            {assignment.institute.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />{" "}
                                {assignment.institute.phone}
                              </span>
                            )}
                            {assignment.institute.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />{" "}
                                {assignment.institute.email}
                              </span>
                            )}
                          </div>

                          {/* Action Buttons: WhatsApp & Call */}
                          {assignment.institute.phone && (
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <a
                                href={`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${waText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                              >
                                <FaWhatsapp className="w-4 h-4" /> Message on WhatsApp
                              </a>
                              <a
                                href={`tel:${assignment.institute.phone}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all active:scale-95"
                              >
                                <Phone className="w-3.5 h-3.5" /> Call Institute
                              </a>
                            </div>
                          )}

                          {/* Area Assignment Tag */}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md">
                              <User className="w-3 h-3" /> ASSIGNED TO YOU
                            </span>
                            {assignment.areaAssignment && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md uppercase">
                                <MapPin className="w-3 h-3 text-rose-500" />{" "}
                                {assignment.areaAssignment.areaName} (
                                {assignment.areaAssignment.radiusKm} KM)
                              </span>
                            )}
                          </div>

                          {/* Address & Remark Display */}
                          {assignment.institute.address && (
                            <p className="text-xs text-slate-600 mt-2 font-medium">
                              📍 {assignment.institute.address}
                            </p>
                          )}
                          {assignment.remark && (
                            <p className="text-xs text-slate-500 mt-1 italic">
                              Note: {assignment.remark}
                            </p>
                          )}
                        </div>

                        {/* Expand / Collapse Edit Button */}
                        <Link
                          href={isExpanded ? "?" : `?edit=${assignment.id}`}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all self-start shrink-0 ${
                            isExpanded
                              ? "bg-slate-200 text-slate-700"
                              : "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                          }`}
                        >
                          {isExpanded ? "Close" : "Update Status"}
                        </Link>
                      </div>
                    </div>

                    {/* Inline Status Update Form */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-5 bg-slate-50/50">
                        <SalesStatusUpdateForm
                          assignmentId={assignment.id}
                          currentStatus={assignment.contactStatus}
                          currentInterest={assignment.interest}
                          currentRemark={assignment.remark}
                          currentPlan={assignment.onboardedPlan}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
