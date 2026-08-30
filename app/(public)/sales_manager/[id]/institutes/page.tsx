import { prisma } from "@/lib/prisma";
import { SalesStatusBadge } from "@/components/sales/SalesStatusBadge";
import { Building2, MapPin, Search, User, Tag, Phone, Mail } from "lucide-react";
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
    const search = typeof sp.search === "string" ? sp.search : "";
    const page = Number(sp.page) || 1;
    const limit = 30;

    // Get the sales manager's assigned categories
    const assignedCategories = await prisma.salesCategoryAssignment.findMany({
        where: { salesManagerId: id },
        select: { categoryId: true, category: { select: { name: true } } },
    });

    const assignedCategoryIds = assignedCategories.map((c: any) => c.categoryId);

    // Build where clause: show institutes in assigned categories
    const whereCondition: any = {};

    if (assignedCategoryIds.length > 0) {
        whereCondition.categories = {
            some: { categoryId: { in: assignedCategoryIds } }
        };
    }

    if (search) {
        whereCondition.name = { contains: search, mode: "insensitive" };
    }

    const [totalInstitutes, institutes] = await Promise.all([
        prisma.institute.count({ where: whereCondition }),
        prisma.institute.findMany({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
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
                        salesManager: { select: { name: true } }
                    }
                }
            },
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { name: "asc" },
        }),
    ]);

    const totalPages = Math.ceil(totalInstitutes / limit);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-teal-600" /> All Institutes
                </h1>
                <p className="text-slate-500 mt-1">
                    Browse institutes in your assigned categories. {totalInstitutes} total.
                </p>

                {/* Assigned Categories */}
                {assignedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs text-slate-500 font-medium">Your categories:</span>
                        {assignedCategories.map((c:any) => (
                            <span key={c.categoryId} className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5" /> {c.category.name}
                            </span>
                        ))}
                    </div>
                )}

                {assignedCategories.length === 0 && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                        No categories assigned yet. Contact your admin to get categories assigned. Showing all institutes.
                    </div>
                )}
            </div>

            {/* Search */}
            <form className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search by institute name..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all"
                />
            </form>

            {/* Institutes Grid */}
            {institutes.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No institutes found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {institutes.map((inst: any) => {
                        const myAssignment = inst.salesAssignment?.salesManagerId === id ? inst.salesAssignment : null;
                        const otherAssignment = inst.salesAssignment?.salesManagerId !== id ? inst.salesAssignment : null;

                        return (
                            <div
                                key={inst.id}
                                className={`p-4 rounded-2xl border transition-all hover:shadow-sm ${
                                    myAssignment
                                        ? "border-teal-200 bg-teal-50/30"
                                        : otherAssignment
                                        ? "border-slate-200 bg-slate-50/50"
                                        : "border-slate-200 bg-white"
                                }`}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-sm text-slate-800 truncate">{inst.name}</h3>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                            <MapPin className="w-3 h-3" />
                                            {inst.city?.name || "N/A"}
                                        </div>
                                        {inst.categories.length > 0 && (
                                            <div className="flex gap-1.5 mt-2 flex-wrap">
                                                {inst.categories.map((c:any) => (
                                                    <span key={c.category.id} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                                        {c.category.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Contact Info & Action Buttons */}
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            {inst.phone && (
                                                <>
                                                    <a
                                                        href={`https://wa.me/${(() => {
                                                            const cleaned = inst.phone.replace(/[^0-9]/g, '');
                                                            return cleaned.length === 10 ? `91${cleaned}` : cleaned;
                                                        })()}?text=${encodeURIComponent(`Hi! I am reaching out from AcademyFind regarding ${inst.name}.`)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                                                    >
                                                        <FaWhatsapp className="w-3.5 h-3.5" /> WhatsApp
                                                    </a>

                                                    <a
                                                        href={`tel:${inst.phone}`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all active:scale-95"
                                                    >
                                                        <Phone className="w-3 h-3 text-slate-500" /> {inst.phone}
                                                    </a>
                                                </>
                                            )}
                                            {inst.email && (
                                                <span className="text-xs text-slate-400 flex items-center gap-1 py-1">
                                                    <Mail className="w-3 h-3 text-slate-400" /> {inst.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                                        {myAssignment ? (
                                            <>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                                                    <User className="w-2.5 h-2.5" /> Assigned to you
                                                </span>
                                                <SalesStatusBadge status={myAssignment.contactStatus} />
                                            </>
                                        ) : otherAssignment ? (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <User className="w-2.5 h-2.5" /> {otherAssignment.salesManager.name}
                                                </span>
                                            
                                        ) : (
                                            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-dashed border-slate-200">
                                                Unassigned
                                            </span>
                                        )}
                                    </div>
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
                        href={`?${new URLSearchParams({ ...(search ? { search } : {}), page: String(page - 1) }).toString()}`}
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
                        href={`?${new URLSearchParams({ ...(search ? { search } : {}), page: String(page + 1) }).toString()}`}
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
