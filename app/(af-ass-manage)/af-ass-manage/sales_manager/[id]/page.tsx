import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SalesStatusBadge } from "@/components/sales/SalesStatusBadge";
import AdminAssignInstituteForm from "@/components/admin/AdminAssignInstituteForm";
import AdminAssignCategoryForm from "@/components/admin/AdminAssignCategoryForm";
import AdminAssignAreaForm from "@/components/admin/AdminAssignAreaForm";
import RemoveAssignmentButton from "@/components/admin/AdminRemoveAssignmentButton";
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

    const [assignments, categoryAssignments, areaAssignments, allInstitutes, allCategories] = await Promise.all([
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
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center shrink-0">
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
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Assignment Forms */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AdminAssignInstituteForm salesManagerId={id} />
                <AdminAssignCategoryForm salesManagerId={id} categories={allCategories} />
                <AdminAssignAreaForm salesManagerId={id} />
            </div>

            {/* Area Assignments */}
            {areaAssignments.length > 0 && (
                <Card className="border-stone-200 shadow-sm overflow-hidden bg-white">
                    <CardHeader className="bg-stone-50 border-b border-stone-100 p-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2 text-stone-800">
                            <MapPin className="w-5 h-5 text-rose-500" /> Assigned Areas ({areaAssignments.length})
                        </CardTitle>
                        <span className="text-xs text-stone-500 font-bold bg-white px-2 py-1 rounded border border-stone-200">
                            {areaAssignments.reduce((acc, a) => acc + a.institutes.length, 0)} institutes in areas
                        </span>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {areaAssignments.map((area: any) => {
                            const totalInArea = area.institutes.length;
                            const onboardedInArea = area.institutes.filter((i: any) => i.contactStatus === "ONBOARDED").length;
                            const contactedInArea = area.institutes.filter((i: any) => i.contactStatus === "CONTACTED").length;
                            const notContactedInArea = area.institutes.filter((i: any) => i.contactStatus === "NOT_CONTACTED").length;

                            return (
                                <div key={area.id} className="border border-stone-200 rounded-2xl p-4 bg-stone-50/50 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm text-stone-800">{area.areaName}</h4>
                                                    <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                                                        {area.radiusKm} km radius
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-stone-400 mt-0.5">
                                                    <span>Assigned: {formatIST(area.createdAt, "MMM dd, yyyy")}</span>
                                                    {area.deadline && (
                                                        <span className="flex items-center gap-1 text-stone-600 font-medium">
                                                            <CalendarDays className="w-3 h-3 text-stone-400" />
                                                            Deadline: {formatIST(area.deadline, "MMM dd, yyyy")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                <span className="bg-white border border-stone-200 px-2 py-1 rounded-lg text-stone-700">
                                                    Total: {totalInArea}
                                                </span>
                                                <span className="bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg text-emerald-700">
                                                    Onboarded: {onboardedInArea}
                                                </span>
                                                <span className="bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg text-blue-700">
                                                    Contacted: {contactedInArea}
                                                </span>
                                                <span className="bg-stone-100 border border-stone-200 px-2 py-1 rounded-lg text-stone-600">
                                                    Pending: {notContactedInArea}
                                                </span>
                                            </div>
                                            <RemoveAssignmentButton assignmentId={area.id} type="area" label={area.areaName} />
                                        </div>
                                    </div>

                                    {/* Expandable Institutes List under this area */}
                                    {totalInArea > 0 && (
                                        <details className="group border-t border-stone-200/80 pt-2">
                                            <summary className="cursor-pointer text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center justify-between py-1 select-none">
                                                <span>View {totalInArea} institutes in {area.areaName}</span>
                                                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-stone-400" />
                                            </summary>
                                            <div className="mt-2 divide-y divide-stone-100 bg-white rounded-xl border border-stone-200 overflow-hidden">
                                                {area.institutes.map((item: any) => (
                                                    <div key={item.id} className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-stone-800 text-sm truncate">{item.institute.name}</p>
                                                            <p className="text-stone-500 text-[11px] truncate">{item.institute.address || item.institute.city?.name}</p>
                                                            {item.institute.phone && (
                                                                <p className="text-stone-400 text-[10px] mt-0.5">📞 {item.institute.phone}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            {item.remark && (
                                                                <span className="text-stone-600 bg-stone-50 px-2 py-1 rounded border border-stone-200 text-[11px] max-w-[200px] truncate" title={item.remark}>
                                                                    💬 {item.remark}
                                                                </span>
                                                            )}
                                                            <SalesStatusBadge status={item.contactStatus} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    )}
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            {/* Category Assignments */}
            {categoryAssignments.length > 0 && (
                <Card className="border-stone-200 shadow-sm overflow-hidden bg-white">
                    <CardHeader className="bg-stone-50 border-b border-stone-100 p-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2 text-stone-800">
                            <FolderTree className="w-5 h-5 text-stone-500" /> Assigned Categories
                        </CardTitle>
                        <span className="text-xs text-stone-500 font-bold bg-white px-2 py-1 rounded border border-stone-200">{categoryAssignments.length} categories</span>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-2">
                            {categoryAssignments.map((ca: any) => (
                                <div
                                    key={ca.id}
                                    className="inline-flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 shadow-sm"
                                >
                                    <span className="text-sm font-bold text-stone-700">{ca.category.name}</span>
                                    {ca.deadline && (
                                        <span className="text-[10px] font-bold text-stone-500 flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                                            <CalendarDays className="w-3 h-3" />
                                            {formatIST(ca.deadline, "MMM dd")}
                                        </span>
                                    )}
                                    <RemoveAssignmentButton assignmentId={ca.id} type="category" label={ca.category.name} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Institute Assignments Table */}
            <Card className="border-stone-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-stone-50 border-b border-stone-100 p-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-stone-800">
                        <Building2 className="w-5 h-5 text-stone-500" /> Assigned Institutes
                    </CardTitle>
                    <span className="text-xs text-stone-500 font-bold bg-white px-2 py-1 rounded border border-stone-200">{assignments.length} institutes</span>
                </CardHeader>

                {assignments.length === 0 ? (
                    <CardContent className="p-8 text-center text-stone-400 text-sm italic">
                        No institutes assigned yet. Use the form above to assign institutes.
                    </CardContent>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-100 text-[11px] uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Institute</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Deadline</th>
                                    <th className="p-4">Remark</th>
                                    <th className="p-4 text-right">Remove</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {assignments.map((a: any) => {
                                    const isOverdue = a.deadline && new Date(a.deadline) < now && a.contactStatus !== "ONBOARDED";
                                    return (
                                        <tr key={a.id} className={`hover:bg-stone-50/50 transition-colors ${isOverdue ? "bg-rose-50/30" : ""}`}>
                                            <td className="p-4 align-top">
                                                <div>
                                                    <div className="font-bold text-stone-800 text-sm">{a.institute.name}</div>
                                                    <div className="text-xs text-stone-500 flex flex-wrap items-center gap-2 mt-1">
                                                        <span className="font-medium">{a.institute.city?.name}</span>
                                                        {a.institute.categories?.[0] && (
                                                            <span className="bg-stone-100 px-1.5 py-0.5 rounded text-[10px] font-bold border border-stone-200">
                                                                {a.institute.categories[0].category.name}
                                                            </span>
                                                        )}
                                                        {a.areaAssignment && (
                                                            <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-200 flex items-center gap-0.5">
                                                                <MapPin className="w-2.5 h-2.5" />
                                                                {a.areaAssignment.areaName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <SalesStatusBadge status={a.contactStatus} />
                                                {a.onboardedPlan && (
                                                    <span className="block mt-2 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded w-fit border border-emerald-100">
                                                        Plan: {a.onboardedPlan}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                {a.deadline ? (
                                                    <span className={`text-xs flex items-center gap-1.5 bg-white w-fit px-2 py-1 rounded border ${isOverdue ? "text-rose-600 font-bold border-rose-200 shadow-sm" : "text-stone-600 font-medium border-stone-200"}`}>
                                                        <CalendarDays className="w-3.5 h-3.5" />
                                                        {formatIST(a.deadline, "MMM dd, yyyy")}
                                                        {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 ml-1" />}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-stone-400 italic">No deadline</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                <span className="text-xs text-stone-600 line-clamp-2 max-w-[200px] leading-relaxed">
                                                    {a.remark || "—"}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top text-right">
                                                <RemoveAssignmentButton assignmentId={a.id} type="institute" label={a.institute.name} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
