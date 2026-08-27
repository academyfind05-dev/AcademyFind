import { prisma } from "@/lib/prisma";
import SalesManagerFilters from "@/components/admin/AdminSalesManagerFilters";
import {
    Briefcase,
    ArrowRight,
    Mail,
    Phone,
    BarChart3,
    Clock,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function AdminSalesManagerPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp = await searchParams;
    const search = typeof sp.search === "string" ? sp.search : "";
    const sort = typeof sp.sort === "string" ? sp.sort : "";

    // Mark sales assignment update notifications as read when admin visits this page
    await prisma.adminNotification.updateMany({
        where: { type: "SALES_ASSIGNMENT_UPDATE", isRead: false },
        data: { isRead: true }
    }).catch(e => console.error("Error marking sales assignment notifications as read:", e));

    // Get all sales managers
    const whereCondition: any = {
        role: "SALES_MANAGER" as any,
    };

    if (search) {
        whereCondition.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            {
                salesAssignments: {
                    some: {
                        institute: {
                            name: { contains: search, mode: "insensitive" }
                        }
                    }
                }
            }
        ];
    }

    const managers = await prisma.user.findMany({
        where: whereCondition,
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            createdAt: true,
            isActive: true,
            salesAssignments: {
                select: {
                    id: true,
                    contactStatus: true,
                    deadline: true,
                    institute: {
                        select: {
                            categories: {
                                include: { category: { select: { name: true } } },
                                take: 1,
                            }
                        }
                    }
                }
            },
            salesCategoryAssignments: {
                select: {
                    category: { select: { name: true } }
                }
            }
        },
        orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    // Compute stats for each manager
    const managersWithStats = managers.map((m: any) => {
        const total = m.salesAssignments.length;
        const onboarded = m.salesAssignments.filter((a: any) => a.contactStatus === "ONBOARDED").length;
        const contacted = m.salesAssignments.filter((a: any) => a.contactStatus === "CONTACTED").length;
        const notContacted = m.salesAssignments.filter((a: any) => a.contactStatus === "NOT_CONTACTED").length;
        const overdue = m.salesAssignments.filter((a: any) =>
            a.deadline && new Date(a.deadline) < now && a.contactStatus !== "ONBOARDED"
        ).length;
        const completionRate = total > 0 ? Math.round((onboarded / total) * 100) : 0;

        // Get unique categories
        const categories = new Set<string>();
        m.salesCategoryAssignments.forEach((c: any) => categories.add(c.category.name));
        m.salesAssignments.forEach((a: any) => {
            a.institute.categories?.forEach((c: any) => categories.add(c.category.name));
        });

        return {
            ...m,
            total,
            onboarded,
            contacted,
            notContacted,
            overdue,
            completionRate,
            categoryNames: Array.from(categories),
        };
    });

    // Sort
    const sortedManagers = [...managersWithStats];
    switch (sort) {
        case "name_asc":
            sortedManagers.sort((a: any,b: any) => (a.name || "").localeCompare(b.name || ""));
            break;
        case "name_desc":
            sortedManagers.sort((a: any,b: any) => (b.name || "").localeCompare(a.name || ""));
            break;
        case "work_desc":
            sortedManagers.sort((a: any,b: any) => b.total - a.total);
            break;
        case "work_asc":
            sortedManagers.sort((a: any,b: any) => a.total - b.total);
            break;
        case "completion_desc":
            sortedManagers.sort((a: any,b: any) => b.completionRate - a.completionRate);
            break;
        case "completion_asc":
            sortedManagers.sort((a: any,b: any) => a.completionRate - b.completionRate);
            break;
        case "overdue_desc":
            sortedManagers.sort((a: any,b: any) => b.overdue - a.overdue);
            break;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-purple-600" /> Sales Managers
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {sortedManagers.length} sales manager{sortedManagers.length !== 1 ? "s" : ""} registered.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <SalesManagerFilters />

            {/* Managers Table */}
            <div className="bg-white/80 backdrop-blur-xl border border-stone-100/60 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4">Manager</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4 text-center">Assignments</th>
                                <th className="p-4 text-center">Progress</th>
                                <th className="p-4">Categories</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100/50">
                            {sortedManagers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">
                                        No sales managers found. Promote a user to &quot;Sales Manager&quot; role from User Management.
                                    </td>
                                </tr>
                            ) : (
                                sortedManagers.map((manager: any) => (
                                    <tr key={manager.id} className="hover:bg-slate-50/50 transition-colors">
                                        {/* Manager Info */}
                                        <td className="p-4">
                                            <Link href={`/af-ass-manage/sales_manager/${manager.id}`} className="flex items-center gap-3 group">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 overflow-hidden shrink-0 border-2 border-transparent group-hover:border-purple-500 transition-colors">
                                                    {manager.image ? (
                                                        <Image src={manager.image} alt="avatar" width={40} height={40} className="w-full h-full object-cover" />
                                                    ) : (
                                                        manager.name?.charAt(0).toUpperCase() || "S"
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                                                        {manager.name || "Unknown"}
                                                    </div>
                                                    {!manager.isActive && (
                                                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Blocked</span>
                                                    )}
                                                </div>
                                            </Link>
                                        </td>

                                        {/* Contact */}
                                        <td className="p-4 text-slate-600 space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" /> {manager.email}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Phone className="w-3.5 h-3.5 text-slate-400" /> {manager.phone || "N/A"}
                                            </div>
                                        </td>

                                        {/* Assignment Stats */}
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="text-center">
                                                    <div className="text-lg font-extrabold text-slate-800">{manager.total}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total</div>
                                                </div>
                                                {manager.overdue > 0 && (
                                                    <div className="text-center">
                                                        <div className="text-lg font-extrabold text-red-600 flex items-center gap-1">
                                                            <AlertTriangle className="w-3.5 h-3.5" />
                                                            {manager.overdue}
                                                        </div>
                                                        <div className="text-[10px] text-red-500 uppercase tracking-wider">Overdue</div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Progress Bar */}
                                        <td className="p-4">
                                            <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all"
                                                        style={{ width: `${manager.completionRate}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                                                    <span className="flex items-center gap-0.5">
                                                        <Clock className="w-2.5 h-2.5 text-stone-500" />
                                                        {manager.contacted}
                                                    </span>
                                                    <span className="flex items-center gap-0.5">
                                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                                        {manager.onboarded}
                                                    </span>
                                                    <span className="font-extrabold text-slate-700">{manager.completionRate}%</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Categories */}
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {manager.categoryNames.length === 0 ? (
                                                    <span className="text-xs text-slate-400">None</span>
                                                ) : (
                                                    manager.categoryNames.slice(0, 3).map((name: any, i: any) => (
                                                        <span key={i} className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium border border-purple-100">
                                                            {name}
                                                        </span>
                                                    ))
                                                )}
                                                {manager.categoryNames.length > 3 && (
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        +{manager.categoryNames.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 text-right">
                                            <Link
                                                href={`/af-ass-manage/sales_manager/${manager.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all"
                                            >
                                                <BarChart3 className="w-3 h-3" /> Details
                                                <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
