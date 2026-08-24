import { prisma } from "@/lib/prisma"
import { Users as UsersIcon, Mail, Phone, Calendar, ArrowRight } from "lucide-react" // ArrowRight add kiya
import { format } from "date-fns";
import { formatIST } from "@/lib/utils";
import { RoleSelect, UserStatusToggle, AdminMessageUserButton } from "@/components/admin/AdminUserClientControl" 
import UserFilters from "@/components/admin/AdminUserFilters"
import UserPagination from "@/components/admin/AdminUserPagination"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import AdminDeleteButton from "@/components/admin/AdminDeleteButton"
import { deleteUserAction } from "./actions"

export default async function AdminUsersPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    // 1. Parse Search Params
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const limit = 50; 
    const search = typeof params.search === 'string' ? params.search : '';
    const role = typeof params.role === 'string' ? params.role : '';

    // 2. Build Prisma Where Condition dynamically
    const whereCondition: any = {};

    if (search) {
        whereCondition.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ];
    }
    
    if (role) {
        whereCondition.role = role as any; 
    }

    // 3. Execute Parallel Queries
    const [totalUsers, users] = await Promise.all([
        prisma.user.count({ where: whereCondition }),
        prisma.user.findMany({
            where: whereCondition,
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { createdAt: 'desc' }
        })
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                        <UsersIcon className="w-8 h-8 text-blue-600" /> User Management
                    </h1>
                    <p className="text-slate-500 mt-1">Found {totalUsers} matching users.</p>
                </div>
            </div>

            <UserFilters />

            {/* Users Table */}
            <div className="bg-white border border-slate-200 rounded-t-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4">User Details</th>
                                <th className="p-4">Contact Info</th>
                                <th className="p-4">Registered On</th>
                                <th className="p-4">Platform Role</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100/50">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">No users match your filters.</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    // 🚀 TR wapas laya gaya HTML rules ke liye
                                    <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${!user.isActive ? 'bg-red-50/30' : ''}`}>
                                        
                                        <td className="p-4">
                                            {/* 🚀 Sirf Name aur Avatar ko link banaya hai */}
                                            <Link href={`/af-ass-manage/users/${user.id}`} className="flex items-center gap-3 group">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 overflow-hidden shrink-0 border-2 border-transparent group-hover:border-blue-500 transition-colors">
                                                    {user.image ? (
                                                        <Image src={user.image} alt="avatar" width={40} height={40} className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.name?.charAt(0).toUpperCase() || "U"
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                                        {user.name || "Unknown User"}
                                                    </div>
                                                    {!user.isActive && <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Blocked</span>}
                                                </div>
                                            </Link>
                                        </td>

                                        <td className="p-4 text-slate-600 space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-slate-400" /> {user.phone || "N/A"}
                                            </div>
                                        </td>

                                        <td className="p-4 text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                {formatIST(user.createdAt, "MMM dd, yyyy, hh:mm a")}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <RoleSelect userId={user.id} currentRole={user.role} />
                                        </td>

                                        <td className="p-4 text-right">
                                            {/* 🚀 Actions block me 'View' button aur Status toggle dono ek sath safe hain */}
                                            <div className="flex items-center justify-end gap-2">
                                                {user.role !== "ADMIN" ? (
                                                    <UserStatusToggle userId={user.id} isActive={user.isActive} />
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-medium px-3 py-1.5">Superuser</span>
                                                )}
                                                <AdminMessageUserButton userId={user.id} userName={user.name || undefined} />
                                                
                                                <Button asChild size="sm" variant="ghost" className="h-8 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 rounded-lg px-3">
                                                    <Link href={`/af-ass-manage/users/${user.id}`}>
                                                        View <ArrowRight className="w-3 h-3 ml-1" />
                                                    </Link>
                                                </Button>

                                                {/* Superusers shouldn't be easily deletable but for now we provide the option, maybe we could disable if user.role is ADMIN */}
                                                {user.role !== "ADMIN" && (
                                                    <AdminDeleteButton id={user.id} onDelete={deleteUserAction} title="Delete User?" />
                                                )}
                                            </div>
                                        </td>
                                        
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <UserPagination totalPages={totalPages} currentPage={page} />

        </div>
    )
}