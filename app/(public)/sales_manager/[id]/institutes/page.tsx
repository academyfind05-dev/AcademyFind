import { prisma } from "@/lib/prisma";
import { SalesStatusBadge } from "@/components/sales/SalesStatusBadge";
import SalesInstituteFilters from "@/components/sales/SalesInstituteFilters";
import { Building2, MapPin, User, Tag, Phone, Mail, Sparkles, Eye } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";

export default async function SalesAllInstitutesPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { id } = await params;
    const sp = await searchParams;

    const page = Number(sp.page) || 1;
    const limit = 30;

    const search = typeof sp.search === "string" ? sp.search : "";
    const cityId = typeof sp.cityId === "string" ? sp.cityId : "";
    const categoryId = typeof sp.categoryId === "string" ? sp.categoryId : "";
    const subscriptionPlan = typeof sp.subscriptionPlan === "string" ? sp.subscriptionPlan : "";
    const status = typeof sp.status === "string" ? sp.status : "all";
    const sortBy = typeof sp.sortBy === "string" ? sp.sortBy : "name_asc";
    const assignment = typeof sp.assignment === "string" ? sp.assignment : "all";

    // Get the sales manager's assigned categories
    const assignedCategories = await prisma.salesCategoryAssignment.findMany({
        where: { salesManagerId: id },
        select: { categoryId: true, category: { select: { id: true, name: true } } },
    });

    const assignedCategoryIds = assignedCategories.map((c: any) => c.categoryId);

    // 1. Build where clause dynamically matching all admin filters
    const whereCondition: any = {};

    if (search) {
        whereCondition.name = { contains: search, mode: "insensitive" };
    }

    if (cityId) {
        whereCondition.cityId = cityId;
    }

    if (categoryId) {
        whereCondition.categories = {
            some: { categoryId }
        };
    } else if (assignedCategoryIds.length > 0) {
        // Default to assigned categories if no specific category filter is chosen
        whereCondition.categories = {
            some: { categoryId: { in: assignedCategoryIds } }
        };
    }

    // Status & Visibility filter
    if (status === "active") whereCondition.isActive = true;
    else if (status === "inactive") whereCondition.isActive = false;
    else if (status === "published") whereCondition.isPublished = true;
    else if (status === "hidden") whereCondition.isPublished = false;

    // Subscription Plan filter
    if (subscriptionPlan) {
        whereCondition.subscriptionPlan = subscriptionPlan;
    }

    // Assignment filter
    if (assignment === "my_assignments") {
        whereCondition.salesAssignments = { salesManagerId: id };
    } else if (assignment === "unassigned") {
        whereCondition.salesAssignments = null;
    } else if (assignment === "other_assignments") {
        whereCondition.salesAssignments = { salesManagerId: { not: id } };
    }

    // 2. Sorting Logic matching admin
    let orderByCondition: any = { name: "asc" };
    if (sortBy === "newest") orderByCondition = { createdAt: "desc" };
    else if (sortBy === "oldest") orderByCondition = { createdAt: "asc" };
    else if (sortBy === "views") orderByCondition = { viewCount: "desc" };

    // 3. Parallel Database Queries
    const [totalInstitutes, institutes, cities, allCategories] = await Promise.all([
        prisma.institute.count({ where: whereCondition }),
        prisma.institute.findMany({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                subscriptionPlan: true,
                isActive: true,
                isPublished: true,
                viewCount: true,
                city: { select: { name: true } },
                categories: {
                    include: { category: { select: { id: true, name: true } } },
                    take: 2,
                },
                salesAssignments: {
                    select: {
                        id: true,
                        salesManagerId: true,
                        contactStatus: true,
                        onboardedPlan: true,
                        salesManager: { select: { name: true } }
                    }
                }
            },
            take: limit,
            skip: (page - 1) * limit,
            orderBy: orderByCondition,
        }),
        prisma.city.findMany({ orderBy: { name: "asc" } }),
        prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);

    const totalPages = Math.ceil(totalInstitutes / limit);

    const buildPaginationUrl = (newPage: number) => {
        const params = new URLSearchParams();
        Object.entries(sp).forEach(([k, v]) => {
            if (v && k !== "page") params.set(k, String(v));
        });
        params.set("page", String(newPage));
        return `?${params.toString()}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-teal-600" /> All Institutes
                </h1>
                <p className="text-slate-500 mt-1">
                    Showing {institutes.length} of {totalInstitutes} total institutes matching your criteria.
                </p>

                {/* Assigned Categories */}
                {assignedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs text-slate-500 font-medium self-center">Your assigned categories:</span>
                        {assignedCategories.map((c: any) => (
                            <span key={c.categoryId} className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5" /> {c.category.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* 🔥 All Filters (Search, Sort, Status, Plan, City, Category, Assignment) */}
            <SalesInstituteFilters cities={cities} categories={allCategories} />

            {/* Institutes Grid */}
            {institutes.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-200">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-600 text-base">No institutes found.</p>
                    <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or search terms.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {institutes.map((inst: any) => {
                        const myAssignment = inst.salesAssignments?.salesManagerId === id ? inst.salesAssignments : null;
                        const otherAssignment = inst.salesAssignments && inst.salesAssignments.salesManagerId !== id ? inst.salesAssignments : null;

                        return (
                            <div
                                key={inst.id}
                                className={`p-5 rounded-3xl border transition-all hover:shadow-sm flex flex-col justify-between ${
                                    myAssignment
                                        ? "border-teal-200 bg-teal-50/20"
                                        : otherAssignment
                                        ? "border-slate-200 bg-slate-50/40"
                                        : "border-slate-200 bg-white"
                                }`}
                            >
                                <div>
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-extrabold text-base text-slate-800 truncate">{inst.name}</h3>
                                                {inst.subscriptionPlan && inst.subscriptionPlan !== "BASIC" && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                                                        <Sparkles className="w-2.5 h-2.5" /> {inst.subscriptionPlan}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                                                <span className="flex items-center gap-1 font-medium">
                                                    <MapPin className="w-3 h-3 text-slate-400" />
                                                    {inst.city?.name || "N/A"}
                                                </span>
                                                {inst.viewCount > 0 && (
                                                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                                        <Eye className="w-3 h-3" /> {inst.viewCount} views
                                                    </span>
                                                )}
                                            </div>

                                            {inst.categories.length > 0 && (
                                                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                                                    {inst.categories.map((c: any) => (
                                                        <span key={c.category.id} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                                                            {c.category.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Assignment Status Badges */}
                                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                                            {myAssignment ? (
                                                <>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                                                        <User className="w-2.5 h-2.5" /> Assigned to you
                                                    </span>
                                                    <SalesStatusBadge status={myAssignment.contactStatus} />
                                                </>
                                            ) : otherAssignment ? (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-slate-200">
                                                    <User className="w-2.5 h-2.5" /> {otherAssignment.salesManager.name}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full border border-dashed border-slate-200">
                                                    Unassigned
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Actions & Footer */}
                                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {inst.phone && (
                                            <>
                                                <a
                                                    href={`https://wa.me/${(() => {
                                                        const cleaned = inst.phone.replace(/[^0-9]/g, '');
                                                        return cleaned.length === 10 ? `91${cleaned}` : cleaned;
                                                    })()}?text=${encodeURIComponent(`Hi! I am reaching out from AcademyFind regarding ${inst.name}.`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                                                >
                                                    <FaWhatsapp className="w-3.5 h-3.5" /> WhatsApp
                                                </a>

                                                <a
                                                    href={`tel:${inst.phone}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all active:scale-95"
                                                >
                                                    <Phone className="w-3 h-3 text-slate-500" /> Call
                                                </a>
                                            </>
                                        )}
                                        {inst.email && (
                                            <span className="text-xs text-slate-400 flex items-center gap-1 py-1">
                                                <Mail className="w-3 h-3 text-slate-400" /> {inst.email}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action link */}
                                    {myAssignment ? (
                                        <Link
                                            href={`/sales_manager/${id}/assignments?search=${encodeURIComponent(inst.name)}`}
                                            className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
                                        >
                                            Manage Assignment →
                                        </Link>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-8 pb-4">
                    {/* Previous Button */}
                    <Link
                        href={buildPaginationUrl(page - 1)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            page <= 1
                                ? "bg-slate-50 text-slate-300 pointer-events-none border border-slate-100"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 shadow-sm"
                        }`}
                        aria-disabled={page <= 1}
                    >
                        &larr; Previous
                    </Link>

                    {/* Page Indicator */}
                    <div className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-50/50 text-slate-600 border border-slate-200">
                        Page <span className="text-teal-600">{page}</span> of {totalPages}
                    </div>

                    {/* Next Button */}
                    <Link
                        href={buildPaginationUrl(page + 1)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            page >= totalPages
                                ? "bg-slate-50 text-slate-300 pointer-events-none border border-slate-100"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 shadow-sm"
                        }`}
                        aria-disabled={page >= totalPages}
                    >
                        Next &rarr;
                    </Link>
                </div>
            )}
        </div>
    );
}
