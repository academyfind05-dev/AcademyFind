import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { formatIST } from "@/lib/utils";
import { ArrowLeft, Building2, Calendar, MessageSquare, Phone, User, History, Zap, Star, BadgeCheck } from "lucide-react";
import CallbackControls from "@/components/admin/AdminCallbackControls";
import LeadDistributionForm from "@/components/admin/AdminLeadDistributionFor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const PLAN_CONFIG = {
  ULTRA: { label: "Ultra", icon: Zap, badgeClass: "bg-purple-100 text-purple-700" },
  PREMIUM: { label: "Premium", icon: Star, badgeClass: "bg-stone-50 text-stone-700 border border-stone-200/50 shadow-sm" },
  VERIFIED: { label: "Verified", icon: BadgeCheck, badgeClass: "bg-emerald-100 text-emerald-700" },
  BASIC: { label: "Basic", icon: Building2, badgeClass: "bg-stone-100 text-stone-700" },
};

export default async function AdminCallbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const callback = await prisma.instituteEnquiry.findUnique({
    where: { id },
    include: {
      institute: true,
      distributionLogs: {
        include: { admin: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!callback) return notFound();

  // Find all unique target institute IDs from individual logs
  const allTargetInstituteIds = Array.from(
    new Set(
      callback.distributionLogs
        .filter((log: any) => log.mode === "individual" && Array.isArray(log.targetInstituteIds))
        .flatMap((log: any) => log.targetInstituteIds as string[])
    )
  ) as string[];

  // Fetch the institute names
  const targetInstitutes = await prisma.institute.findMany({
    where: { id: { in: allTargetInstituteIds } },
    select: { id: true, name: true },
  });

  // Create a map for quick lookup
  const instituteMap = new Map(targetInstitutes.map((inst: any) => [inst.id, inst.name]));

  return (
    <div className="w-full space-y-6">
      <Link href="/af-ass-manage/instituteCallbacks" className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Callbacks
      </Link>

      <Card className="border-stone-200 shadow-sm bg-white overflow-hidden">

        {/* Header Section */}
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start pb-6 gap-4 bg-stone-50/50">
          <div>
            <CardTitle className="text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <User className="w-6 h-6 text-stone-400" /> {callback.name}
            </CardTitle>
            <div className="text-sm font-medium text-stone-500 flex items-center gap-1.5 bg-white px-3 py-1.5 mt-3 rounded-xl border border-stone-200 w-fit shadow-sm">
              <Calendar className="w-4 h-4" /> {formatIST(callback.createdAt)}
            </div>
          </div>

          {/* Controls Component */}
          <div className="shrink-0 flex flex-col gap-2">
            <CallbackControls 
              id={callback.id} 
              currentStatus={callback.status} 
              currentUserContactStatus={callback.userContactStatus}
              studentName={callback.name}
              studentPhone={callback.phone}
              instituteName={callback.institute?.name}
              institutePhone={callback.institute?.phone || ""}
              instituteSlug={callback.institute ? `${callback.institute.id}-${callback.institute.slug}` : undefined}
              studentMessage={callback.message || ""}
              adminNote={callback.adminNote}
            />
          </div>
        </CardHeader>

        <Separator className="bg-stone-100" />

        <CardContent className="p-6 md:p-8 space-y-8">
          {/* Target Institute Link Card */}
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Enquired For</h3>
            {callback.institute ? (
              <Link
                href={`/af-ass-manage/institutes/${callback.institute.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-100 hover:border-stone-300 transition group"
              >
                <div className="p-3 bg-white rounded-xl shadow-sm text-stone-500 group-hover:scale-105 transition">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 group-hover:text-stone-700 transition">{callback.institute.name}</h4>
                  <p className="text-sm text-stone-500 flex items-center gap-1 mt-0.5">
                    Click to view institute profile in admin panel &rarr;
                  </p>
                </div>
              </Link>
            ) : (
              <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 font-medium">
                The target institute has been deleted from the database.
              </div>
            )}
          </div>

          {/* Contact Details Grid */}
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Student Contact Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <a href={`tel:${callback.phone}`} className="flex items-center gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50 transition group">
                <div className="p-2.5 bg-white rounded-xl shadow-sm text-emerald-500"><Phone className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Mobile Number</p>
                  <p className="font-semibold text-stone-800">{callback.phone}</p>
                </div>
              </a>
            </div>
          </div>

          {/* Message Box */}
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Student Message</h3>
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-stone-700 leading-relaxed shadow-sm flex gap-3">
              <MessageSquare className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
              {callback.message ? (
                <p className="whitespace-pre-wrap">{callback.message}</p>
              ) : (
                <p className="text-stone-400 italic">No custom message was provided by the student.</p>
              )}
            </div>
          </div>

          {/* 🚀 Status History */}
          {callback.statusHistory && callback.statusHistory.length > 0 && (
            <div className="pt-4 border-t border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-stone-500" /> Status Timeline
              </h3>
              <div className="space-y-3">
                {callback.statusHistory.map((history: any) => (
                  <div key={history.id} className="bg-stone-50 border border-stone-100 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2 text-sm text-stone-700">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{history.statusType === 'INSTITUTE' ? 'Institute' : 'Student'} Status</span>
                      <span className="text-stone-400">changed from</span>
                      <Badge variant="outline" className="bg-stone-100 text-stone-600 border-stone-200 uppercase text-[10px] shadow-none">{history.oldStatus || "NEW"}</Badge>
                      <ArrowLeft className="w-3 h-3 text-stone-400 rotate-180" />
                      <Badge variant="outline" className={`uppercase text-[10px] shadow-none
                        ${history.newStatus === 'MESSAGED' ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
                        ${history.newStatus === 'CALLED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}
                        ${history.newStatus === 'DNP' ? 'bg-orange-100 text-orange-700 border-orange-200' : ''}
                        ${history.newStatus === 'JUNK' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                        ${!['MESSAGED', 'CALLED', 'DNP', 'JUNK'].includes(history.newStatus) ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                      `}>{history.newStatus}</Badge>
                    </div>
                    <div className="text-xs text-stone-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatIST(history.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🚀 Distribution History */}
          {callback.distributionLogs && callback.distributionLogs.length > 0 && (
            <div className="pt-4 border-t border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-stone-500" /> Distribution History
              </h3>

              <div className="space-y-3">
                {callback.distributionLogs.map((log: any, idx: number) => {
                  const bulkFilters = typeof log.bulkFilters === 'string' ? JSON.parse(log.bulkFilters) : log.bulkFilters;
                  const isIndividual = log.mode === 'individual';

                  return (
                    <div key={log.id} className="bg-stone-50 border border-stone-100 rounded-2xl p-4 hover:border-stone-200 transition">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-sm font-bold text-stone-900">
                            {isIndividual ? '👤 Individual Selection' : '📊 Bulk Distribution'}
                          </p>
                          <p className="text-xs text-stone-500 mt-0.5">
                            By <b>{log.admin?.name || log.admin?.email || 'Unknown'}</b> • {formatIST(log.createdAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 uppercase tracking-wider font-bold shadow-none whitespace-nowrap">
                          {log.targetCount} Institutes
                        </Badge>
                      </div>

                      {isIndividual && log.targetInstituteIds && log.targetInstituteIds.length > 0 && (
                        <div className="mt-3 text-xs text-stone-600 bg-white rounded-lg p-3 border border-stone-100 shadow-sm">
                          <p className="font-bold text-stone-700 mb-2">Forwarded to:</p>
                          <ul className="list-none space-y-1">
                            {log.targetInstituteIds.map((instId: string) => (
                              <li key={instId} className="flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                                <Link prefetch={false} href={`/af-ass-manage/institutes/${instId}`} className="text-blue-600 hover:underline hover:text-blue-800 font-medium">
                                  {instituteMap.get(instId) || 'Unknown Institute'}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!isIndividual && bulkFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-stone-600 bg-white rounded-lg p-3 border border-stone-100 shadow-sm">
                          {bulkFilters.plansAll ? (
                            <div><b>Plans:</b> All Plans</div>
                          ) : bulkFilters.plans?.length > 0 ? (
                            <div><b>Plans:</b> {bulkFilters.plans.join(', ')}</div>
                          ) : null}

                          {bulkFilters.citiesAll ? (
                            <div><b>Cities:</b> All Cities</div>
                          ) : bulkFilters.cityIds?.length > 0 ? (
                            <div><b>Cities:</b> {bulkFilters.cityIds.length} selected</div>
                          ) : null}

                          {bulkFilters.categoriesAll ? (
                            <div><b>Categories:</b> All Categories</div>
                          ) : bulkFilters.categoryIds?.length > 0 ? (
                            <div><b>Categories:</b> {bulkFilters.categoryIds.length} selected</div>
                          ) : null}

                          {bulkFilters.search && (
                            <div><b>Search:</b> "{bulkFilters.search}"</div>
                          )}
                        </div>
                      )}

                      {log.adminNote && (
                        <div className="mt-3 p-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 shadow-sm">
                          <b>Note:</b> {log.adminNote}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🚀 LEAD DISTRIBUTION FORM */}
      <LeadDistributionForm
        enquiryId={callback.id}
        originalInstituteId={callback.instituteId}
        studentName={callback.name}
      />
    </div>
  );
}