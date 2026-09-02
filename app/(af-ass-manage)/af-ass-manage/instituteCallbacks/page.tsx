import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { formatIST } from "@/lib/utils";
import { MessageSquare, Building2, Eye, Calendar, User, Phone, Filter, ArrowLeft, UserCheck } from "lucide-react";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";
import { deleteCallbackAction } from "./actions";

export default async function AdminCallbacksPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams;
  const currentFilter = params.status || 'ALL';
  const instituteIdFilter = params.instituteId;
  const salesManagerFilter = params.salesManagerId || 'ALL';

  // 🚀 Sirf Original Leads dikhani hain Admin ko, copies nahi!
  const whereCondition: any = {
    isForwarded: false
  };

  if (currentFilter !== 'ALL') {
    whereCondition.status = currentFilter;
  }
  
  if (instituteIdFilter) {
    whereCondition.instituteId = instituteIdFilter;
  }

  if (salesManagerFilter === 'UNASSIGNED') {
    whereCondition.assignedSalesManagerId = null;
  } else if (salesManagerFilter !== 'ALL') {
    whereCondition.assignedSalesManagerId = salesManagerFilter;
  }

  // Fetch callbacks and active sales managers
  const [callbacks, salesManagers] = await Promise.all([
    prisma.instituteEnquiry.findMany({
      where: whereCondition,
      include: {
        institute: {
          select: {
            id: true,
            name: true,
          }
        },
        assignedSalesManager: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.user.findMany({
      where: { role: "SALES_MANAGER", isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" }
    })
  ]);

  // Filter options array
  const filterOptions = [
    { label: "All", value: "ALL" },
    { label: "New", value: "NEW" },
    { label: "Messaged", value: "MESSAGED" },
    { label: "Called", value: "CALLED" },
    { label: "DNP (Did Not Pick)", value: "DNP" },
    { label: "Junk", value: "JUNK" },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          {instituteIdFilter && (
            <Link href={`/af-ass-manage/institutes/${instituteIdFilter}`} className="inline-flex items-center text-sm font-semibold text-stone-500 hover:text-stone-800 transition-colors mb-2">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Institute Settings
            </Link>
          )}
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-stone-500" /> Original Callbacks
          </h1>
          <p className="text-slate-500 mt-1">Manage and monitor root student enquiries. (Showing: {currentFilter})</p>
        </div>
        <div className="bg-stone-100 text-stone-800 px-4 py-2 rounded-xl font-bold text-sm shrink-0">
          Total Leads: {callbacks.length}
        </div>
      </div>

      {/* 🚀 Filter Bars */}
      <div className="flex flex-col gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <div className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mr-2 shrink-0">
            <Filter className="w-4 h-4" /> Status:
          </div>
          {filterOptions.map((opt: any) => (
            <Link
              key={opt.value}
              prefetch={false}
              href={`/af-ass-manage/instituteCallbacks?status=${opt.value}${salesManagerFilter !== 'ALL' ? `&salesManagerId=${salesManagerFilter}` : ''}${instituteIdFilter ? `&instituteId=${instituteIdFilter}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${currentFilter === opt.value
                ? "bg-stone-900 text-white shadow-md shadow-stone-900/20 scale-105"
                : "bg-white border border-stone-100 text-slate-500 hover:bg-stone-50 hover:text-stone-700 hover:border-stone-200"
                }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {/* Sales Manager Filters */}
        {salesManagers.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="text-sm font-bold text-indigo-400 flex items-center gap-1.5 mr-2 shrink-0">
              <UserCheck className="w-4 h-4 text-indigo-600" /> Sales Manager:
            </div>
            <Link
              prefetch={false}
              href={`/af-ass-manage/instituteCallbacks?status=${currentFilter}&salesManagerId=ALL${instituteIdFilter ? `&instituteId=${instituteIdFilter}` : ''}`}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${salesManagerFilter === 'ALL'
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white border border-indigo-100 text-indigo-700 hover:bg-indigo-50"
              }`}
            >
              All
            </Link>
            <Link
              prefetch={false}
              href={`/af-ass-manage/instituteCallbacks?status=${currentFilter}&salesManagerId=UNASSIGNED${instituteIdFilter ? `&instituteId=${instituteIdFilter}` : ''}`}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${salesManagerFilter === 'UNASSIGNED'
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white border border-indigo-100 text-indigo-700 hover:bg-indigo-50"
              }`}
            >
              Unassigned
            </Link>
            {salesManagers.map((sm: any) => (
              <Link
                key={sm.id}
                prefetch={false}
                href={`/af-ass-manage/instituteCallbacks?status=${currentFilter}&salesManagerId=${sm.id}${instituteIdFilter ? `&instituteId=${instituteIdFilter}` : ''}`}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${salesManagerFilter === sm.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white border border-indigo-100 text-indigo-700 hover:bg-indigo-50"
                }`}
              >
                {sm.name || sm.email}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-4">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-stone-50/50 border-b border-stone-100/50 text-slate-500 uppercase tracking-wider text-xs font-bold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student Info</th>
                <th className="py-3 px-4">Original Target Institute</th>
                <th className="py-3 px-4">Admin Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100/50">
              {callbacks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400 font-medium">
                    No callbacks found for "{currentFilter}".
                  </td>
                </tr>
              ) : (
                callbacks.map((callback: any) => (
                  <tr key={callback.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col text-slate-700 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatIST(callback.createdAt, "dd MMM yyyy")}
                        </div>
                        <span className="text-xs text-slate-400 mt-1 pl-6">{formatIST(callback.createdAt, "hh:mm a")}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {callback.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{callback.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      {callback.institute ? (
                        <div className="flex flex-col gap-1.5">
                          <Link
                            href={`/af-ass-manage/institutes/${callback.institute.id}`}
                            prefetch={false}
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold transition"
                          >
                            <Building2 className="w-4 h-4 shrink-0" />
                            <span className="truncate max-w-[180px]">{callback.institute.name}</span>
                          </Link>
                          <div>
                            {callback.assignedSalesManager ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                <UserCheck className="w-3 h-3" /> {callback.assignedSalesManager.name || callback.assignedSalesManager.email}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 italic">
                                <UserCheck className="w-3 h-3" /> Unassigned
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-red-400 italic">Institute Deleted</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-stone-400 uppercase w-16">Institute:</span>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider
                            ${callback.status === 'NEW' ? 'bg-stone-50 text-stone-700 border border-stone-200/50 shadow-sm' : ''}
                            ${callback.status === 'MESSAGED' ? 'bg-purple-100 text-purple-700' : ''}
                            ${callback.status === 'CALLED' ? 'bg-emerald-100 text-emerald-700' : ''}
                            ${callback.status === 'DNP' ? 'bg-orange-100 text-orange-700' : ''}
                            ${callback.status === 'JUNK' ? 'bg-red-100 text-red-700' : ''}
                            ${!['NEW', 'MESSAGED', 'CALLED', 'DNP', 'JUNK'].includes(callback.status) ? 'bg-slate-100 text-slate-700' : ''}
                          `}>
                            {callback.status || "NEW"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-stone-400 uppercase w-16">Student:</span>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider
                            ${callback.userContactStatus === 'NEW' ? 'bg-stone-50 text-stone-700 border border-stone-200/50 shadow-sm' : ''}
                            ${callback.userContactStatus === 'MESSAGED' ? 'bg-purple-100 text-purple-700' : ''}
                            ${callback.userContactStatus === 'CALLED' ? 'bg-emerald-100 text-emerald-700' : ''}
                            ${callback.userContactStatus === 'DNP' ? 'bg-orange-100 text-orange-700' : ''}
                            ${callback.userContactStatus === 'JUNK' ? 'bg-red-100 text-red-700' : ''}
                            ${!['NEW', 'MESSAGED', 'CALLED', 'DNP', 'JUNK'].includes(callback.userContactStatus) ? 'bg-slate-100 text-slate-700' : ''}
                          `}>
                            {callback.userContactStatus || "NEW"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link prefetch={false} href={`/af-ass-manage/instituteCallbacks/${callback.id}`}>
                          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-stone-600 hover:border-stone-200 hover:bg-stone-50 transition-all shadow-xs cursor-pointer">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <AdminDeleteButton id={callback.id} onDelete={deleteCallbackAction} title="Delete Callback?" />
                      </div>
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