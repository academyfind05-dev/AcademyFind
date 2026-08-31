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
