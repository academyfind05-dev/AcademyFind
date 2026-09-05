"use client";

import { TrendingUp, Phone, PhoneOff, CheckCircle2, AlertTriangle, Rocket, Headphones } from "lucide-react";

interface SalesDashboardStatsProps {
    total: number;
    notContacted: number;
    contacted: number;
    onboarded: number;
    upgraded?: number;
    overdue: number;
    callbacksCount?: number;
}

export default function SalesDashboardStats({
    total,
    notContacted,
    contacted,
    onboarded,
    upgraded = 0,
    overdue,
    callbacksCount = 0,
}: SalesDashboardStatsProps) {
    const stats = [
        {
            label: "Total Assigned",
            value: total,
            icon: <TrendingUp className="w-5 h-5" />,
            bg: "bg-indigo-50",
            iconColor: "text-indigo-600",
            border: "border-indigo-100",
        },
        {
            label: "Student Leads",
            value: callbacksCount,
            icon: <Headphones className="w-5 h-5" />,
            bg: "bg-teal-50",
            iconColor: "text-teal-600",
            border: "border-teal-100",
        },
        {
            label: "Not Contacted",
            value: notContacted,
            icon: <PhoneOff className="w-5 h-5" />,
            bg: "bg-slate-50",
            iconColor: "text-slate-500",
            border: "border-slate-200",
        },
        {
            label: "Contacted",
            value: contacted,
            icon: <Phone className="w-5 h-5" />,
            bg: "bg-amber-50",
            iconColor: "text-amber-600",
            border: "border-amber-100",
        },
        {
            label: "Onboarded",
            value: onboarded,
            icon: <CheckCircle2 className="w-5 h-5" />,
            bg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            border: "border-emerald-100",
        },
        {
            label: "Upgraded 🚀",
            value: upgraded,
            icon: <Rocket className="w-5 h-5" />,
            bg: "bg-violet-50",
            iconColor: "text-violet-600",
            border: "border-violet-100",
        },
        {
            label: "Overdue",
            value: overdue,
            icon: <AlertTriangle className="w-5 h-5" />,
            bg: "bg-red-50",
            iconColor: "text-red-600",
            border: "border-red-100",
            alert: overdue > 0,
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className={`relative p-4 rounded-2xl border ${stat.border} ${stat.bg} transition-all hover:shadow-sm`}
                >
                    {stat.alert && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                    <div className={`mb-2 ${stat.iconColor}`}>{stat.icon}</div>
                    <div className="text-2xl font-extrabold text-slate-800">{stat.value}</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}
