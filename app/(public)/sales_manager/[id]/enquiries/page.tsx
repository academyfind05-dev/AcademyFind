import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatIST } from "@/lib/utils";
import { Headphones, Building2, Eye, Calendar, User, Phone, Filter, MessageSquare, Sparkles } from "lucide-react";

export default async function SalesManagerEnquiriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const currentFilter = sp.status || "ALL";
  const search = sp.search || "";

  const whereCondition: any = {
    assignedSalesManagerId: id,
    isForwarded: false,
  };

  if (currentFilter !== "ALL") {
    whereCondition.status = currentFilter;
  }

  if (search.trim()) {
    whereCondition.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { phone: { contains: search.trim() } },
      { institute: { name: { contains: search.trim(), mode: "insensitive" } } },
    ];
  }

  const enquiries = await prisma.instituteEnquiry.findMany({
    where: whereCondition,
    include: {
      institute: {
        select: {
          id: true,
          name: true,
          phone: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const filterOptions = [
    { label: "All Leads", value: "ALL" },
    { label: "New", value: "NEW" },
    { label: "Messaged", value: "MESSAGED" },
    { label: "Called", value: "CALLED" },
    { label: "DNP", value: "DNP" },
    { label: "Junk", value: "JUNK" },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
              <Headphones className="w-6 h-6" />
            </div>
            Assigned Student Enquiries
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Student enquiries assigned to you by Admin. Connect with students and institutes, add notes, and update statuses.
          </p>
        </div>
        <div className="bg-teal-50 text-teal-800 border border-teal-100 px-4 py-2 rounded-2xl font-bold text-sm shrink-0">
          Assigned Leads: {enquiries.length}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-2 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Filter Status:
        </div>
        {filterOptions.map((opt) => (
          <Link
            key={opt.value}
            prefetch={false}
            href={`/sales_manager/${id}/enquiries?status=${opt.value}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              currentFilter === opt.value
                ? "bg-teal-700 text-white shadow-sm shadow-teal-700/20 scale-105"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs font-bold">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Student Details</th>
                <th className="p-4">Enquired Institute</th>
                <th className="p-4">Current Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Headphones className="w-8 h-8 text-slate-300" />
                      <p>No enquiries assigned to you under "{currentFilter}".</p>
                    </div>
                  </td>
                </tr>
              ) : (
                enquiries.map((enquiry: any) => (
                  <tr key={enquiry.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatIST(enquiry.createdAt, "dd MMM yyyy")}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 pl-5">
                          {formatIST(enquiry.createdAt, "hh:mm a")}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-teal-600" /> {enquiry.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {enquiry.phone}
                      </div>
                      {enquiry.message && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 italic">
                          "{enquiry.message}"
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      {enquiry.institute ? (
                        <div>
                          <div className="inline-flex items-center gap-1.5 text-slate-900 font-bold">
                            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{enquiry.institute.name}</span>
                          </div>
                          {enquiry.institute.phone && (
                            <p className="text-xs text-slate-500 mt-0.5">📞 {enquiry.institute.phone}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-red-400 italic">Institute Not Found</span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase w-14">Institute:</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                              enquiry.status === "NEW"
                                ? "bg-amber-100 text-amber-800"
                                : enquiry.status === "MESSAGED"
                                ? "bg-purple-100 text-purple-700"
                                : enquiry.status === "CALLED"
                                ? "bg-emerald-100 text-emerald-700"
                                : enquiry.status === "DNP"
                                ? "bg-orange-100 text-orange-700"
                                : enquiry.status === "JUNK"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {enquiry.status || "NEW"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase w-14">Student:</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                              enquiry.userContactStatus === "NEW"
                                ? "bg-amber-100 text-amber-800"
                                : enquiry.userContactStatus === "MESSAGED"
                                ? "bg-purple-100 text-purple-700"
                                : enquiry.userContactStatus === "CALLED"
                                ? "bg-emerald-100 text-emerald-700"
                                : enquiry.userContactStatus === "DNP"
                                ? "bg-orange-100 text-orange-700"
                                : enquiry.userContactStatus === "JUNK"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {enquiry.userContactStatus || "NEW"}
                          </span>
                        </div>

                        {enquiry.lastUpdatedByName && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                            <span>Updated by: {enquiry.lastUpdatedByName}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        prefetch={false}
                        href={`/sales_manager/${id}/enquiries/${enquiry.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View & Update
                      </Link>
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
