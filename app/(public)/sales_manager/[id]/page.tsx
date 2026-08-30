import { prisma } from "@/lib/prisma";
import SalesDashboardStats from "@/components/sales/SalesDashboardStats";
import { SalesStatusBadge } from "@/components/sales/SalesStatusBadge";
import { Clock, AlertTriangle, ArrowRight, Building2, CalendarDays, MapPin, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatIST } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales Manager Control Panel | AcademyFind",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SalesManagerDashboardPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const [assignments, assignedAreas] = await Promise.all([
        prisma.salesAssignment.findMany({
            where: { salesManagerId: id },
            include: {
                institute: {
                    select: {
                        name: true,
                        city: { select: { name: true } },
                        categories: {
                            include: { category: { select: { name: true } } },
                            take: 1,
                        },
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
            orderBy: { updatedAt: "desc" },
        }),
        prisma.salesAreaAssignment.findMany({
            where: { salesManagerId: id },
            include: {
                institutes: {
                    select: {
                        id: true,
                        contactStatus: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })
    ]);

    const now = new Date();

    const total = assignments.length;
    const notContacted = assignments.filter((a: any) => a.contactStatus === "NOT_CONTACTED").length;
    const contacted = assignments.filter((a: any) => a.contactStatus === "CONTACTED").length;
    const onboarded = assignments.filter((a: any) => a.contactStatus === "ONBOARDED").length;
    const upgraded = assignments.filter((a: any) => a.contactStatus === "UPGRADED").length;
    const overdue = assignments.filter((a: any) =>
        a.deadline && new Date(a.deadline) < now && a.contactStatus !== "ONBOARDED" && a.contactStatus !== "UPGRADED"
    ).length;

    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = assignments
        .filter((a: any) =>
            a.deadline &&
            new Date(a.deadline) >= now &&
            new Date(a.deadline) <= sevenDaysLater &&
            a.contactStatus !== "ONBOARDED" &&
            a.contactStatus !== "UPGRADED"
        )
        .sort((a: any, b: any) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

    // Recent activity (last 5 updated)
    const recentActivity = assignments.slice(0, 5);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Banner */}
            <div className="bg-linear-to-r from-teal-900 to-cyan-800 rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2">Sales Dashboard</h1>
                <p className="text-teal-200 max-w-2xl">
                    Track your institute outreach progress, manage contacts, and stay on top of deadlines.
                </p>
            </div>

            {/* Stats */}
            <SalesDashboardStats
                total={total}
                notContacted={notContacted}
                contacted={contacted}
                onboarded={onboarded}
                upgraded={upgraded}
                overdue={overdue}
            />

            {/* Assigned Areas (if any) */}
            {assignedAreas.length > 0 && (
                <div className="border border-slate-200 bg-white rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-rose-500" /> My Assigned Areas ({assignedAreas.length})
                        </h3>
                        <Link href={`/sales_manager/${id}/assignments`} className="text-xs font-bold text-teal-600 hover:underline">
                            View in Assignments →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assignedAreas.map((area: any) => {
                            const totalArea = area.institutes.length;
                            const onboardedArea = area.institutes.filter((i: any) => i.contactStatus === "ONBOARDED").length;
                            const contactedArea = area.institutes.filter((i: any) => i.contactStatus === "CONTACTED").length;
                            const pendingArea = area.institutes.filter((i: any) => i.contactStatus === "NOT_CONTACTED").length;
                            const pct = totalArea > 0 ? Math.round((onboardedArea / totalArea) * 100) : 0;

                            return (
                                <div key={area.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-bold text-sm text-slate-800 truncate">{area.areaName}</h4>
                                            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                                {area.radiusKm} km
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {totalArea} institutes assigned
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
                                        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                                            <span>Progress ({pct}%)</span>
                                            <span className="text-emerald-700 font-bold">{onboardedArea} / {totalArea} Onboarded</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                                            <div style={{ width: `${pct}%` }} className="bg-emerald-500 h-full rounded-full transition-all duration-500" />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-400">
                                            <span>{contactedArea} Contacted</span>
                                            <span>{pendingArea} Pending</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Upcoming Deadlines */}
                <div className="border border-slate-200 bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" /> Upcoming Deadlines
                        </h3>
                        <Link href={`/sales_manager/${id}/assignments`} className="text-xs font-bold text-teal-600 hover:underline">
                            View All
                        </Link>
                    </div>
                    <div className="p-5 flex-1 space-y-3">
                        {upcomingDeadlines.length === 0 ? (
                            <div className="text-center text-slate-400 py-8 text-sm">No upcoming deadlines! 🎉</div>
                        ) : (
                            upcomingDeadlines.slice(0, 5).map((a: any) => (
                                <div key={a.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-slate-800 truncate">{a.institute.name}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            <CalendarDays className="w-3 h-3" />
                                            Due: {formatIST(a.deadline!, "MMM dd, yyyy")}
                                        </p>
                                    </div>
                                    <SalesStatusBadge status={a.contactStatus} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="border border-slate-200 bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" /> Recent Activity
                        </h3>
                        <Link href={`/sales_manager/${id}/assignments`} className="text-xs font-bold text-teal-600 hover:underline">
                            View All
                        </Link>
                    </div>
                    <div className="p-5 flex-1 space-y-3">
                        {recentActivity.length === 0 ? (
                            <div className="text-center text-slate-400 py-8 text-sm">No assignments yet. Admin will assign institutes to you.</div>
                        ) : (
                            recentActivity.map((a: any) => (
                                <div key={a.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-slate-800 truncate flex items-center gap-2">
                                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            {a.institute.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5 ml-5.5 text-xs text-slate-500 flex-wrap">
                                            <span>{a.institute.city?.name}</span>
                                            {a.institute.categories?.[0] && <span>· {a.institute.categories[0].category.name}</span>}
                                            {a.areaAssignment && (
                                                <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded border border-rose-200 flex items-center gap-0.5">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    {a.areaAssignment.areaName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <SalesStatusBadge status={a.contactStatus} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Quick Action */}
            {total > 0 && (
                <div className="text-center pt-2">
                    <Link
                        href={`/sales_manager/${id}/assignments`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white text-sm font-bold rounded-2xl hover:bg-teal-700 transition-all shadow-sm hover:shadow-md"
                    >
                        Go to My Assignments <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}
