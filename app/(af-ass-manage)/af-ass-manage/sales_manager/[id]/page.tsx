import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SalesStatusBadge } from "@/components/sales/SalesStatusBadge";
import AdminAssignInstituteForm from "@/components/admin/AdminAssignInstituteForm";
import AdminAssignCategoryForm from "@/components/admin/AdminAssignCategoryForm";
import AdminAssignAreaForm from "@/components/admin/AdminAssignAreaForm";
import AdminManageSalesAssignments from "@/components/admin/AdminManageSalesAssignments";
import {
    User,
    Mail,
    Phone,
    Building2,
    FolderTree,
    CalendarDays,
    ArrowLeft,
    CheckCircle2,
    Clock,
    PhoneOff,
    AlertTriangle,
    ExternalLink,
    MapPin,
    ChevronDown,
    Headphones,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { formatIST } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function AdminSalesManagerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const manager = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            role: true,
            createdAt: true,
            isActive: true,
        }
    });

    if (!manager || manager.role !== "SALES_MANAGER") {
        notFound();
    }

    const [assignments, categoryAssignments, areaAssignments, allInstitutes, allCategories, assignedCallbacks] = await Promise.all([
        // Current assignments
        prisma.salesAssignment.findMany({
            where: { salesManagerId: id },
            include: {
                institute: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        city: { select: { name: true } },
                        categories: {
                            include: { category: { select: { name: true } } },
                            take: 2,
                        }
                    }
                },
                areaAssignment: {
                    select: {
                        id: true,
                        areaName: true,
                        radiusKm: true,
                    }
                }
            },
            orderBy: [{ contactStatus: "asc" }, { deadline: "asc" }],
        }),

        // Category assignments
        prisma.salesCategoryAssignment.findMany({
            where: { salesManagerId: id },
            include: {
                category: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "desc" },
        }),

        // Area assignments with linked institutes & their real-time statuses
        prisma.salesAreaAssignment.findMany({
            where: { salesManagerId: id },
            include: {
                institutes: {
                    include: {
                        institute: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                phone: true,
                                address: true,
                                city: { select: { name: true } },
                            }
                        }
                    },
                    orderBy: [{ contactStatus: "asc" }, { updatedAt: "desc" }]
                }
            },
            orderBy: { createdAt: "desc" },
        }),

        // All institutes for assignment form (exclude already assigned)
        prisma.institute.findMany({
            where: {
                salesAssignments: null
            },
            select: {
                id: true,
                name: true,
                city: { select: { name: true } },
            },
            orderBy: { name: "asc" },
            take: 500,
        }),

        // All categories for assignment form (exclude already assigned)
        prisma.category.findMany({
            where: {
                isActive: true,
                NOT: {
                    salesCategoryAssignments: {
                        some: { salesManagerId: id }
                    }
                }
            },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),

        // Assigned student callbacks
        prisma.instituteEnquiry.findMany({
            where: {
                assignedSalesManagerId: id,
                isForwarded: false,
            },
            include: {
                institute: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        phone: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        }),
    ]);

    const now = new Date();
    const total = assignments.length;
    const onboarded = assignments.filter((a: any)=> a.contactStatus === "ONBOARDED").length;
    const contacted = assignments.filter((a:any) => a.contactStatus === "CONTACTED").length;
    const notContacted = assignments.filter((a: any) => a.contactStatus === "NOT_CONTACTED").length;
    const overdue = assignments.filter((a:any) =>
        a.deadline && new Date(a.deadline) < now && a.contactStatus !== "ONBOARDED"
    ).length;
    const completionRate = total > 0 ? Math.round((onboarded / total) * 100) : 0;

    const formatStatus = (s: string) => {
        switch (s) {
            case "CALL_BACK": return "Call Back";
            case "FOLLOW_UP": return "Follow Up";
            case "PENDING": return "Pending";
            case "APPROVED": return "Approved";
            case "REJECTED": return "Rejected";
            case "MESSAGED": return "Messaged";
            case "CALLED": return "Called";
            case "DNP": return "DNP";
            case "JUNK": return "Junk";
            case "NEW": return "New";
            default: return s;
        }
    };

    const getStatusBadgeClass = (s: string) => {
        switch (s) {
            case "APPROVED": return "bg-green-100 text-green-700 border border-green-200";
            case "REJECTED": return "bg-red-100 text-red-700 border border-red-200";
            case "CALL_BACK": return "bg-indigo-100 text-indigo-700 border border-indigo-200";
            case "FOLLOW_UP": return "bg-orange-100 text-orange-700 border border-orange-200";
            case "MESSAGED": return "bg-purple-100 text-purple-700 border border-purple-200";
            case "CALLED": return "bg-emerald-100 text-emerald-700 border border-emerald-200";
            case "DNP": return "bg-amber-100 text-amber-700 border border-amber-200";
            case "JUNK": return "bg-red-100 text-red-700 border border-red-200";
            case "PENDING":
            case "NEW":
            default:
                return "bg-stone-100 text-stone-700 border border-stone-200";
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Back Link */}
            <Link href="/af-ass-manage/sales_manager" className="inline-flex items-center text-xs text-stone-500 hover:text-stone-800 transition-colors font-semibold">
                <ArrowLeft className="w-3 h-3 mr-1" /> Back to All Sales Managers
            </Link>

            {/* Manager Profile Header */}
            <Card className="border-stone-200 shadow-sm overflow-hidden bg-white">
                <CardContent className="p-8">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-stone-100 flex items-center justify-center font-bold text-3xl text-stone-500 overflow-hidden shrink-0 border border-stone-200 shadow-sm">
                            {manager.image ? (
                                <Image src={manager.image} alt="avatar" width={80} height={80} className="w-full h-full object-cover" />
                            ) : (
                                manager.name?.charAt(0).toUpperCase() || "S"
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">{manager.name || "Sales Manager"}</h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-stone-500 font-medium">
                                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-stone-400" /> {manager.email}</span>
                                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-stone-400" /> {manager.phone || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                <Link
                                    href={`/sales_manager/${id}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-stone-100 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-200 transition-all shadow-sm"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> View as Manager
                                </Link>
                                <Link
                                    href={`/af-ass-manage/instituteCallbacks?salesManagerId=${id}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all shadow-sm"
                                >
                                    <Headphones className="w-3.5 h-3.5" /> Filter in Callbacks ({assignedCallbacks.length})
                                </Link>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center shrink-0">
                            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 min-w-[70px]">
                                <div className="text-xl font-extrabold text-stone-800">{total}</div>
                                <div className="text-[9px] uppercase tracking-wider text-stone-500 mt-1 font-bold">Total</div>
                            </div>
                            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 min-w-[70px]">
                                <div className="text-xl font-extrabold flex items-center justify-center gap-1 text-stone-800">
                                    <PhoneOff className="w-3 h-3 text-rose-400" />{notContacted}
                                </div>
                                <div className="text-[9px] uppercase tracking-wider text-stone-500 mt-1 font-bold">Pending</div>
                            </div>
                            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 min-w-[70px]">
                                <div className="text-xl font-extrabold flex items-center justify-center gap-1 text-stone-800">
                                    <Clock className="w-3 h-3 text-amber-400" />{contacted}
                                </div>
                                <div className="text-[9px] uppercase tracking-wider text-stone-500 mt-1 font-bold">Called</div>
                            </div>
                            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 min-w-[70px]">
                                <div className="text-xl font-extrabold flex items-center justify-center gap-1 text-stone-800">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />{onboarded}
                                </div>
                                <div className="text-[9px] uppercase tracking-wider text-stone-500 mt-1 font-bold">Done</div>
                            </div>
                            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 min-w-[70px]">
                                <div className={`text-xl font-extrabold ${overdue > 0 ? "text-rose-600" : "text-stone-800"}`}>
                                    {completionRate}%
                                </div>
                                <div className="text-[9px] uppercase tracking-wider text-stone-500 mt-1 font-bold">Rate</div>
                            </div>
                            <div className="bg-indigo-50/70 rounded-xl p-3 border border-indigo-100 min-w-[70px]">
                                <div className="text-xl font-extrabold text-indigo-700 flex items-center justify-center gap-1">
                                    <Headphones className="w-3.5 h-3.5" />{assignedCallbacks.length}
                                </div>
                                <div className="text-[9px] uppercase tracking-wider text-indigo-600 mt-1 font-bold">Leads</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 🎯 Assigned Student Callback Leads Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                    <div>
                        <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                            <Headphones className="w-5 h-5 text-indigo-600" /> Assigned Student Callbacks
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                            Student enquiries directly assigned to this manager for outreach and follow-up.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-xl text-xs font-bold">
                            {assignedCallbacks.length} Assigned {assignedCallbacks.length === 1 ? "Lead" : "Leads"}
                        </span>
                        <Link
                            href="/af-ass-manage/instituteCallbacks"
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-3 py-1 rounded-xl shadow-xs transition"
                        >
                            Manage All Callbacks &rarr;
                        </Link>
                    </div>
                </div>

                {assignedCallbacks.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-3xl text-stone-400 font-medium bg-stone-50/50 text-xs">
                        No student callbacks are currently assigned to this sales manager. You can assign callbacks from <Link href="/af-ass-manage/instituteCallbacks" className="text-indigo-600 underline font-bold">Institute Callbacks</Link>.
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-stone-600">
                                <thead className="bg-stone-50/70 border-b border-stone-100 text-stone-500 uppercase tracking-wider text-[11px] font-bold">
                                    <tr>
                                        <th className="py-3.5 px-4">Date</th>
                                        <th className="py-3.5 px-4">Student</th>
                                        <th className="py-3.5 px-4">Target Institute</th>
                                        <th className="py-3.5 px-4">Status</th>
                                        <th className="py-3.5 px-4">Notes</th>
                                        <th className="py-3.5 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {assignedCallbacks.map((cb: any) => (
                                        <tr key={cb.id} className="hover:bg-stone-50/50 transition">
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="font-semibold text-stone-800">{formatIST(cb.createdAt, "dd MMM yyyy")}</div>
                                                <div className="text-[10px] text-stone-400">{formatIST(cb.createdAt, "hh:mm a")}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-stone-900">{cb.name}</div>
                                                <div className="text-stone-500 flex items-center gap-1 mt-0.5">
                                                    <Phone className="w-3 h-3 text-stone-400" /> {cb.phone}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {cb.institute ? (
                                                    <Link href={`/af-ass-manage/institutes/${cb.institute.id}`} className="font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                                        <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                                        <span className="truncate max-w-[180px]">{cb.institute.name}</span>
                                                    </Link>
                                                ) : (
                                                    <span className="text-rose-400 italic">Institute Deleted</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-stone-400 uppercase">Inst:</span>
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${getStatusBadgeClass(cb.status)}`}>
                                                            {formatStatus(cb.status || "NEW")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-stone-400 uppercase">Stud:</span>
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${getStatusBadgeClass(cb.userContactStatus)}`}>
                                                            {formatStatus(cb.userContactStatus || "NEW")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 max-w-[220px]">
                                                {cb.adminNote ? (
                                                    <p className="truncate text-stone-700 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5" title={cb.adminNote}>
                                                        <span className="font-bold text-amber-800">Admin:</span> {cb.adminNote}
                                                    </p>
                                                ) : cb.salesManagerNote ? (
                                                    <p className="truncate text-stone-700 bg-teal-50 border border-teal-200/60 rounded px-1.5 py-0.5" title={cb.salesManagerNote}>
                                                        <span className="font-bold text-teal-800">Sales:</span> {cb.salesManagerNote}
                                                    </p>
                                                ) : (
                                                    <span className="text-stone-400 italic">No notes yet</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                <Link
                                                    href={`/af-ass-manage/instituteCallbacks/${cb.id}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition border border-indigo-200 shadow-xs"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" /> View Lead
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Assignment Forms */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AdminAssignInstituteForm salesManagerId={id} />
                <AdminAssignCategoryForm salesManagerId={id} categories={allCategories} />
                <AdminAssignAreaForm salesManagerId={id} />
            </div>

            {/* Interactive Assignments Management (Delete Whole / Selective Multi-Select) */}
            <AdminManageSalesAssignments
                salesManagerId={id}
                salesManagerName={manager.name || "Sales Manager"}
                initialAssignments={assignments as any}
                initialAreas={areaAssignments as any}
                initialCategories={categoryAssignments as any}
            />
        </div>
    );
}
