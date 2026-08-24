import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { formatIST } from "@/lib/utils";
import { MessageSquare, Building2, Eye, Calendar, User, Phone, Filter } from "lucide-react";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";
import { deleteCallbackAction } from "./actions";

export default async function AdminCallbacksPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams;
  const currentFilter = params.status || 'ALL';

  // 🚀 Sirf Original Leads dikhani hain Admin ko, copies nahi!
  const whereCondition: any = {
    isForwarded: false
  };

  if (currentFilter !== 'ALL') {
    if (currentFilter.startsWith('ASSIGNED_TO_')) {
      // Optional logic here
    } else {
      whereCondition.status = currentFilter;
    }
  }

  // Fetch callbacks based on filter
  const callbacks = await prisma.instituteEnquiry.findMany({
    where: whereCondition,
    include: {
      institute: {
        select: {
          id: true,
          name: true,
        }
      },
      // 🚀 BONUS: Hum ye count bhi manga lete hain taaki table me dikha sakein
      // ki kya ye admin ne aage kisi ko distribute/sell kari hai ya nahi.
      // (Agar iska koi child hoga matlab ye distribute hui hai)
      // _count: {
      //     select: {
      //         // Prisma mein self-relation array ko access karne ke liye relation name chahiye
      //         // Iske liye schema mein `children InstituteEnquiry[] @relation("ForwardedLeads")` type add karna hota hai.
      //         // Abhi simple rakhte hain, hum detail page pe check karenge.
      //     }
      // }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

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
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-stone-500" /> Original Callbacks
          </h1>
          <p className="text-slate-500 mt-1">Manage and monitor root student enquiries. (Showing: {currentFilter})</p>
        </div>
        <div className="bg-stone-100 text-stone-800 px-4 py-2 rounded-xl font-bold text-sm shrink-0">
          Total Leads: {callbacks.length}
        </div>
      </div>

      {/* 🚀 Simple Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <div className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mr-2">
          <Filter className="w-4 h-4" /> Filter:
        </div>
        {filterOptions.map((opt: any) => (
          <Link
            key={opt.value}
            prefetch={false}
            href={`/af-ass-manage/instituteCallbacks?status=${opt.value}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${currentFilter === opt.value
              ? "bg-stone-900 text-white shadow-md shadow-stone-900/20 scale-105"
              : "bg-white border border-stone-100 text-slate-500 hover:bg-stone-50 hover:text-stone-700 hover:border-stone-200"
              }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-4">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-stone-50/50 border-b border-stone-100/50 text-slate-500 uppercase tracking-wider text-xs font-bold">
              <tr>
                <th className="p-5">Date</th>
                <th className="p-5">Student Info</th>
                <th className="p-5">Original Target Institute</th>
                <th className="p-5">Admin Status</th>
                <th className="p-5 text-right">Action</th>
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
                    <td className="p-5 whitespace-nowrap">
                      <div className="flex flex-col text-slate-700 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatIST(callback.createdAt, "dd MMM yyyy")}
                        </div>
                        <span className="text-xs text-slate-400 mt-1 pl-6">{formatIST(callback.createdAt, "hh:mm a")}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {callback.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{callback.phone}</div>
                    </td>
                    <td className="p-5">
                      {callback.institute ? (
                        <Link
                          href={`/af-ass-manage/institutes/${callback.institute.id}`}
                          prefetch={false}
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold transition"
                        >
                          <Building2 className="w-4 h-4" />
                          <span className="truncate max-w-[200px]">{callback.institute.name}</span>
                        </Link>
                      ) : (
                        <span className="text-red-400 italic">Institute Deleted</span>
                      )}
                    </td>
                    <td className="p-5">
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
                    <td className="p-5 text-right">
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