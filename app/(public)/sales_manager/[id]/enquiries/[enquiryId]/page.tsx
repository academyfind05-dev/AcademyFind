import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { formatIST } from "@/lib/utils";
import { ArrowLeft, Building2, Calendar, MessageSquare, Phone, User, History, Zap, Star, BadgeCheck, Mail } from "lucide-react";
import CallbackControls from "@/components/admin/AdminCallbackControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export default async function SalesManagerEnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string; enquiryId: string }>;
}) {
  const { id, enquiryId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const enquiry = await prisma.instituteEnquiry.findUnique({
    where: { id: enquiryId },
    include: {
      institute: true,
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!enquiry) return notFound();

  // Verify access: Only Admin or the Assigned Sales Manager can view this enquiry
  if (session.user.role !== "ADMIN" && enquiry.assignedSalesManagerId !== session.user.id) {
    return (
      <div className="p-12 text-center text-red-500 font-bold text-xl">
        Unauthorized: This enquiry is not assigned to you.
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Link
        href={`/sales_manager/${id}/enquiries`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Assigned Leads
      </Link>

      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-3xl">
        {/* Header Section */}
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start pb-6 gap-4 bg-slate-50/60 p-6 md:p-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold mb-3">
              <span>🎯 Assigned to You</span>
            </div>
            <CardTitle className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <User className="w-7 h-7 text-teal-600" /> {enquiry.name}
            </CardTitle>
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 bg-white px-3 py-1.5 mt-3 rounded-xl border border-slate-200 w-fit shadow-xs">
              <Calendar className="w-4 h-4 text-slate-400" /> Received: {formatIST(enquiry.createdAt)}
            </div>
          </div>

          {/* Controls Component in Sales Manager Mode */}
          <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
            <CallbackControls
              id={enquiry.id}
              currentStatus={enquiry.status}
              currentUserContactStatus={enquiry.userContactStatus}
              studentName={enquiry.name}
              studentPhone={enquiry.phone}
              instituteName={enquiry.institute?.name}
              institutePhone={enquiry.institute?.phone || ""}
              instituteSlug={enquiry.institute ? `${enquiry.institute.id}-${enquiry.institute.slug}` : undefined}
              studentMessage={enquiry.message || ""}
              adminNote={enquiry.adminNote}
              salesManagerNote={enquiry.salesManagerNote}
              isSalesManager={true}
              lastUpdatedByRole={enquiry.lastUpdatedByRole}
              lastUpdatedByName={enquiry.lastUpdatedByName}
            />
          </div>
        </CardHeader>

        <Separator className="bg-slate-100" />

        <CardContent className="p-6 md:p-8 space-y-8">
          {/* Target Institute Link Card */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Enquired Institute</h3>
            {enquiry.institute ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-white rounded-2xl shadow-xs text-teal-700 border border-slate-100">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">{enquiry.institute.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" /> {enquiry.institute.phone || "No phone available"}
                    </p>
                    {enquiry.institute.address && (
                      <p className="text-xs text-slate-400 mt-0.5">{enquiry.institute.address}</p>
                    )}
                  </div>
                </div>

                <Link
                  href={`/institute/${enquiry.institute.id}-${enquiry.institute.slug}`}
                  target="_blank"
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs w-fit"
                >
                  View Public Institute Page ↗
                </Link>
              </div>
            ) : (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
                Institute record not found.
              </div>
            )}
          </div>

          {/* Student Info & Message Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Contact Details</h3>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-900">{enquiry.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${enquiry.phone}`} className="text-teal-700 font-bold hover:underline">
                    {enquiry.phone}
                  </a>
                </div>
                {enquiry.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{enquiry.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Query / Message</h3>
              <div className="flex gap-2 text-sm text-slate-700 leading-relaxed">
                <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                {enquiry.message ? (
                  <p className="whitespace-pre-wrap">{enquiry.message}</p>
                ) : (
                  <p className="text-slate-400 italic">No specific message provided.</p>
                )}
              </div>
            </div>
          </div>

          {/* 🚀 Status History Timeline */}
          {enquiry.statusHistory && enquiry.statusHistory.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" /> Status Timeline
              </h3>
              <div className="space-y-3">
                {enquiry.statusHistory.map((history) => (
                  <div
                    key={history.id}
                    className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-700"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">
                        {history.statusType === "INSTITUTE" ? "Institute" : "Student"} Status
                      </span>
                      <span className="text-slate-400">changed from</span>
                      <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 uppercase text-[10px] shadow-none">
                        {history.oldStatus || "NEW"}
                      </Badge>
                      <ArrowLeft className="w-3 h-3 text-slate-400 rotate-180" />
                      <Badge
                        variant="outline"
                        className={`uppercase text-[10px] shadow-none font-bold ${
                          history.newStatus === "MESSAGED"
                            ? "bg-purple-100 text-purple-700 border-purple-200"
                            : history.newStatus === "CALLED"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : history.newStatus === "DNP"
                            ? "bg-orange-100 text-orange-700 border-orange-200"
                            : history.newStatus === "JUNK"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {history.newStatus}
                      </Badge>
                      {history.updatedByName && (
                        <span className="text-[11px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                          by <strong>{history.updatedByName}</strong> ({history.updatedByRole === "SALES_MANAGER" ? "Sales Manager" : "Admin"})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatIST(history.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
