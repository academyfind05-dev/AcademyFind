import { prisma } from "@/lib/prisma"
import {
    Users,
    Building2,
    FileText,
    FolderTree,
    ArrowRight,
    Clock,
    ShieldAlert,
    PhoneCall,
    LifeBuoy,
    MessageCircle,
    Activity
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns";
import { formatIST } from "@/lib/utils";

import { getTrafficData } from '@/lib/User/admin/analytics';

export default async function AdminDashboardPage() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        totalUsers,
        totalInstitutes,
        totalCategories,
        pendingClaimsCount,
        pendingCallbacks,
        pendingLifeCoach,
        pendingChatReports,
        pendingInstituteRequests,
        pendingBlogs,
        recentClaims,
        recentUsers,
        gaData
    ] = await Promise.all([
        prisma.user.count(),
        prisma.institute.count(),
        prisma.category.count(),
        prisma.instituteClaim.count({ where: { status: "PENDING" } }),
        prisma.instituteEnquiry.count({ where: { status: "NEW", isForwarded: false } }),
        prisma.lifeCoachRequest.count({ where: { status: "PENDING" } }),
        prisma.messageReport.count({ where: { status: "PENDING" } }),
        prisma.instituteRequest.count({ where: { status: "PENDING" } }),
        prisma.blogPost.count({ where: { status: "PENDING_REVIEW" } }),

        // Latest 5 Pending Claims
        prisma.instituteClaim.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { institute: { select: { name: true } } }
        }),

        // Latest 5 Registered Users
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        }),

        // Fetch GA4 Data
        getTrafficData()
    ]);

    // Get today's GA4 traffic (last item in chartData array usually)
    let todayVisitorsCount = 0;
    if (!('error' in gaData) && 'chartData' in gaData && Array.isArray(gaData.chartData) && gaData.chartData.length > 0) {
        todayVisitorsCount = gaData.chartData[gaData.chartData.length - 1].visitors || 0;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* 1. Welcome Banner */}
            <div className="bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900 rounded-[2rem] p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-stone-300 opacity-20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
                <h1 className="text-4xl font-extrabold tracking-tight mb-3">Platform Overview</h1>
                <p className="text-stone-100/90 max-w-2xl text-lg font-medium">
                    Welcome to the Superuser Dashboard. Monitor the entire AcademyFind platform's metrics and recent activities from your elegant control center.
                </p>
            </div>

            {/* 2. Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Live Visitors Today"
                    value={todayVisitorsCount}
                    icon={<Activity className="w-5 h-5 text-indigo-600 animate-pulse" />}
                    bg="bg-white border border-indigo-100"
                    link="/af-ass-manage/analytics/visitors"
                />
                <StatCard
                    title="Total Users"
                    value={totalUsers}
                    icon={<Users className="w-5 h-5 text-stone-600" />}
                    bg="bg-white border border-stone-100"
                    link="/af-ass-manage/users"
                />
                <StatCard
                    title="Institutes Listed"
                    value={totalInstitutes}
                    icon={<Building2 className="w-5 h-5 text-emerald-600" />}
                    bg="bg-white border border-emerald-50"
                    link="/af-ass-manage/institutes"
                />
                <StatCard
                    title="Pending Claims"
                    value={pendingClaimsCount}
                    icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
                    bg="bg-white border border-rose-50"
                    link="/af-ass-manage/claims"
                    alert={pendingClaimsCount > 0}
                />
                <StatCard
                    title="New Callbacks"
                    value={pendingCallbacks}
                    icon={<PhoneCall className="w-5 h-5 text-blue-600" />}
                    bg="bg-white border border-blue-50"
                    link="/af-ass-manage/instituteCallbacks"
                    alert={pendingCallbacks > 0}
                />
                <StatCard
                    title="New Institute List Requests"
                    value={pendingInstituteRequests}
                    icon={<FolderTree className="w-5 h-5 text-green-600" />}
                    bg="bg-white border border-green-50"
                    link="/af-ass-manage/instituteRequests"
                    alert={pendingInstituteRequests > 0}
                />
                <StatCard
                    title="Life Coach Requests"
                    value={pendingLifeCoach}
                    icon={<LifeBuoy className="w-5 h-5 text-indigo-600" />}
                    bg="bg-white border border-indigo-50"
                    link="/af-ass-manage/life-coach"
                    alert={pendingLifeCoach > 0}
                />
                <StatCard
                    title="Blogs Pending Review"
                    value={pendingBlogs}
                    icon={<FileText className="w-5 h-5 text-indigo-600" />}
                    bg="bg-white border border-indigo-50"
                    link="/af-ass-manage/blog"
                    alert={pendingBlogs > 0}
                />
                <StatCard
                    title="Chat Reports"
                    value={pendingChatReports}
                    icon={<MessageCircle className="w-5 h-5 text-stone-600" />}
                    bg="bg-white border border-stone-50"
                    link="/af-ass-manage/chat"
                    alert={pendingChatReports > 0}
                />
            </div>

            {/* 3. Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">

                {/* Left: Pending Claims */}
                <div className="border border-stone-100/50 bg-white/60 backdrop-blur-md rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-stone-100/50 bg-stone-50/30 flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-lg">
                            <div className="p-2 bg-rose-100 rounded-xl"><FileText className="w-5 h-5 text-rose-600" /></div> Action Required: Claims
                        </h3>
                        <Link href="/af-ass-manage/claims" className="text-sm font-bold text-stone-600 hover:text-stone-700 hover:underline">View All</Link>
                    </div>
                    <div className="p-6 flex-1 space-y-4">
                        {recentClaims.length === 0 ? (
                            <div className="text-center text-slate-400 py-8 text-sm">No pending claims. All caught up! 🎉</div>
                        ) : (
                            recentClaims.map((claim: any) => (
                                <div key={claim.id} className="flex justify-between items-center p-4 rounded-2xl border border-slate-100/80 bg-white shadow-sm hover:shadow-md hover:border-stone-200 transition-all duration-300">
                                    <div>
                                        <p className="font-bold text-slate-800 line-clamp-1">{claim.institute.name}</p>
                                        <p className="text-sm text-slate-500 mt-1">Claimed by: <span className="font-medium">{claim.fullName}</span></p>
                                    </div>
                                    <Link href="/af-ass-manage/claims" className="shrink-0 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-stone-600 transition-colors shadow-sm">
                                        Review
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Newest Users */}
                <div className="border border-stone-100/50 bg-white/60 backdrop-blur-md rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-stone-100/50 bg-stone-50/30 flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-lg">
                            <div className="p-2 bg-blue-100 rounded-xl"><Users className="w-5 h-5 text-blue-600" /></div> New Registrations
                        </h3>
                        <Link href="/af-ass-manage/users" className="text-sm font-bold text-stone-600 hover:text-stone-700 hover:underline">Manage Users</Link>
                    </div>
                    <div className="p-6 flex-1 space-y-4">
                        {recentUsers.length === 0 ? (
                            <div className="text-center text-slate-400 py-8 text-sm">No users found.</div>
                        ) : (
                            recentUsers.map((user: any) => (
                                <div key={user.id} className="p-4 rounded-2xl border border-slate-100/80 bg-white shadow-sm hover:shadow-md hover:border-stone-200 transition-all duration-300">
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <p className="font-bold text-slate-800 truncate flex-1">{user.name || "Anonymous"}</p>
                                        <span className="text-[10px] bg-stone-100/80 text-stone-800 border border-stone-200 px-2 py-1 rounded-md uppercase font-extrabold tracking-wider shrink-0 max-w-[110px] sm:max-w-none truncate text-center">
                                            {user.role}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-2 mt-1">
                                        <p className="text-sm text-slate-500 truncate flex-1">
                                            {user.email}
                                        </p>
                                        <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1 shrink-0">
                                            <Clock className="w-3 h-3 shrink-0" /> {formatIST(user.createdAt, "MMM d")}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

// Helper Component for Stat Cards
function StatCard({ title, value, icon, bg, link, alert }: any) {
    return (
        <Link href={link} className="block group">
            <div className={`relative p-6 rounded-3xl border border-stone-100/50 bg-white/70 backdrop-blur-lg shadow-sm hover:shadow-[0_8px_30px_rgb(120,113,108,0.12)] hover:-translate-y-1 transition-all duration-300 h-full ${alert ? 'ring-2 ring-rose-400 shadow-[0_8px_30px_rgb(225,29,72,0.1)]' : ''}`}>
                {alert && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                    </span>
                )}
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-[1.25rem] ${bg}`}>
                        {icon}
                    </div>
                    <ArrowRight className="w-5 h-5 text-stone-200 group-hover:text-stone-600 group-hover:translate-x-1.5 transition-all duration-300" />
                </div>
                <div>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tight">{value}</h3>
                    <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-wider">{title}</p>
                </div>
            </div>
        </Link>
    )
}