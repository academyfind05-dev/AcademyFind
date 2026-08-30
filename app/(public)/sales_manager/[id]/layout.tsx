import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import {
    ArrowLeft,
    LayoutDashboard,
    ClipboardList,
    Building2,
    MessageCircle,
} from "lucide-react";
import { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ManagerSidebarWrapper } from "@/components/manager/ManagerSidebarWrapper";

export const metadata: Metadata = {
  title: "Sales Manager Control Panel | AcademyFind",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SalesManagerLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: any;
}) {
    const { id } = await params;

    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/login');
    }

    // Only the sales manager themselves or an admin can access
    if (session.user.role !== "ADMIN" && session.user.id !== id) {
        return (
            <div className="p-12 text-center text-red-500 font-bold text-xl">
                Unauthorized Access!
            </div>
        );
    }

    // Verify user is a sales manager
    const salesManager = await prisma.user.findUnique({
        where: { id },
        select: { name: true, role: true, email: true }
    });

    if (!salesManager || (salesManager.role !== "SALES_MANAGER" && session.user.role !== "ADMIN")) {
        return (
            <div className="p-12 text-center text-red-500 font-bold text-xl">
                User is not a Sales Manager.
            </div>
        );
    }

    return (
        <div className="bg-slate-50/50 min-h-screen pb-12">
            <div className="container mx-auto max-w-7xl pt-8 px-4 flex flex-col md:flex-row gap-8">

                {/* --- SIDEBAR --- */}
                <ManagerSidebarWrapper title="Sales Dashboard">
                    {/* Header */}
                    <div>
                        <Link href="/" className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 mb-4 transition-colors">
                            <ArrowLeft className="w-3 h-3 mr-1" /> Back to Main Site
                        </Link>
                        <h2 className="font-extrabold text-xl text-slate-900 leading-tight">
                            {salesManager.name || "Sales Manager"}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{salesManager.email}</p>
                        <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold bg-teal-100 text-teal-700 px-2.5 py-0.5 rounded-full">
                            Sales Manager
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-1.5 mt-6">
                        <SidebarLink
                            href={`/sales_manager/${id}`}
                            icon={<LayoutDashboard />}
                            label="Dashboard"
                        />
                        <SidebarLink
                            href={`/sales_manager/${id}/assignments`}
                            icon={<ClipboardList />}
                            label="My Assignments"
                        />
                        <SidebarLink
                            href={`/sales_manager/${id}/institutes`}
                            icon={<Building2 />}
                            label="All Institutes"
                        />
                        <SidebarLink
                            href="/chat"
                            icon={<MessageCircle />}
                            label="Chat & Messages"
                        />
                    </nav>
                </ManagerSidebarWrapper>

                {/* --- MAIN CONTENT AREA --- */}
                <main className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 min-h-[600px]">
                    {children}
                </main>
            </div>
        </div>
    );
}

// Helper Component for Sidebar Links
function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-teal-50 hover:text-teal-700 text-slate-600"
        >
            <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
            {label}
        </Link>
    );
}
