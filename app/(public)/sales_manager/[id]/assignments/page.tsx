import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { SalesStatusBadge, InterestBadge } from "@/components/sales/SalesStatusBadge";
import SalesStatusUpdateForm from "@/components/sales/SalesStatusUpdateForm";
import SalesAssignmentFilters from "@/components/sales/SalesAssignmentFilters";
import { ClipboardList, MapPin, CalendarDays, User, Building2, MessageSquare, Phone, Mail } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { format } from "date-fns";
import { formatIST } from "@/lib/utils";

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
    
    if (Object.keys(instituteFilter).length > 0) whereCondition.institute = instituteFilter;

    const [assignments, categories] = await Promise.all([
        prisma.salesAssignment.findMany({
            where: whereCondition,
            include: {
                institute: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        address: true,
                        city: { select: { name: true } },
                        categories: {
                            include: { category: { select: { id: true, name: true } } },
                        },
                    }
                },
                salesManager: {
                    select: { id: true, name: true }
                },
                areaAssignment: {
                    select: { id: true, areaName: true, radiusKm: true }
                }
            },
            orderBy: [{ contactStatus: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
        }),

        // Get all categories for filter dropdown
        prisma.category.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ]);

    const now = new Date();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                    <ClipboardList className="w-8 h-8 text-teal-600" /> My Assignments
                </h1>
                <p className="text-slate-500 mt-1">
                    {assignments.length} institute{assignments.length !== 1 ? "s" : ""} assigned to you.
                </p>
            </div>

            {/* Filters */}
            <SalesAssignmentFilters categories={categories} />

            {/* Assignments List */}
            {assignments.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No assignments match your filters.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {assignments.map((assignment: any) => {
                        const isOverdue = assignment.deadline && new Date(assignment.deadline) < now && assignment.contactStatus !== "ONBOARDED" && assignment.contactStatus !== "UPGRADED";
                        const isExpanded = expandedId === assignment.id;

                        const cleanPhone = assignment.institute?.phone?.replace(/[^0-9]/g, "");
                        const formattedPhone = cleanPhone ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : "";
                        const waText = encodeURIComponent(`Hi! I am reaching out from AcademyFind regarding ${assignment.institute?.name || "your institute"}.`);

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
                                                    <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-bold" : ""}`}>
                                                        <CalendarDays className="w-3 h-3" />
                                                        Deadline: {formatIST(assignment.deadline, "MMM dd, yyyy")}
                                                    </span>
                                                )}
                                                {assignment.institute.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3 text-slate-400" /> {assignment.institute.phone}
                                                    </span>
                                                )}
                                                {assignment.institute.email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3 text-slate-400" /> {assignment.institute.email}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action Buttons: WhatsApp & Call */}
                                            {assignment.institute.phone && (
                                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                                    <a
                                                        href={`https://wa.me/${formattedPhone}?text=${waText}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                                                    >
                                                        <FaWhatsapp className="w-4 h-4" /> Message on WhatsApp
                                                    </a>

                                                    <a
                                                        href={`tel:${assignment.institute.phone}`}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all active:scale-95"
                                                    >
                                                        <Phone className="w-3.5 h-3.5 text-slate-500" /> Call Institute
                                                    </a>
                                                </div>
                                            )}

                                            {/* Ownership Tags */}
                                            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                                                    <User className="w-2.5 h-2.5" /> Assigned to you
                                                </span>
                                                {assignment.areaAssignment && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                                        <MapPin className="w-2.5 h-2.5" /> {assignment.areaAssignment.areaName} ({assignment.areaAssignment.radiusKm} km)
                                                    </span>
                                                )}
                                            </div>

                                            {/* Remark Preview */}
                                            {assignment.remark && (
                                                <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                                                    <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" />
                                                    <span className="line-clamp-2">{assignment.remark}</span>
                                                </div>
                                            )}

                                            {/* Onboarded / Upgraded Plan */}
                                            {(assignment.contactStatus === "ONBOARDED" || assignment.contactStatus === "UPGRADED") && assignment.onboardedPlan && (
                                                <div className="mt-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                                        assignment.contactStatus === "UPGRADED"
                                                            ? "text-violet-800 bg-violet-100 border-violet-200"
                                                            : "text-emerald-700 bg-emerald-100 border-emerald-200"
                                                    }`}>
                                                        {assignment.contactStatus === "UPGRADED" ? "Upgraded Plan" : "Plan"}: {assignment.onboardedPlan}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit Toggle */}
                                        <a
                                            href={isExpanded ? `?${new URLSearchParams(Object.fromEntries(Object.entries(sp).filter(([k]) => k !== "edit").map(([k, v]) => [k, String(v)]))).toString()}` : `?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)])), edit: assignment.id }).toString()}`}
                                            className={`shrink-0 px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                                                isExpanded
                                                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                                    : "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                                            }`}
                                        >
                                            {isExpanded ? "Close" : "Update Status"}
                                        </a>
                                    </div>
                                </div>

                                {/* Expanded Edit Form */}
                                {isExpanded && (
                                    <div className="border-t border-slate-200 p-5">
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
    );
}
