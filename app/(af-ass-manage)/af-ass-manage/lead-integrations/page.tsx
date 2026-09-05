import { prisma } from "@/lib/prisma";
import {
  Share2,
  Building2,
  Phone,
  Calendar,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  Layers,
  Code2,
} from "lucide-react";
import { SiGoogle, SiMeta, SiZapier } from "react-icons/si";
import Link from "next/link";
import { formatIST } from "@/lib/utils";
import InboundLeadsExplorer from "@/components/admin/InboundLeadsExplorer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ad & Webhook Lead Integrations | Admin Center",
  description: "Monitor Google Ads, Meta Ads and Custom Webhook lead integrations connected by institutes.",
};

export default async function LeadIntegrationsPage() {
  // 1. Fetch all integrations with institute details
  const [integrations, leads, totalLeadsCount, todayLeadsCount] = await Promise.all([
    prisma.inboundLeadIntegration.findMany({
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            slug: true,
            subscriptionPlan: true,
            imageUrl: true,
            city: { select: { name: true } },
          },
        },
        _count: {
          select: { leads: true },
        },
      },
      orderBy: { lastLeadAt: "desc" },
    }),

    prisma.inboundLead.findMany({
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            slug: true,
            subscriptionPlan: true,
            city: { select: { name: true } },
          },
        },
        integration: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),

    prisma.inboundLead.count(),

    prisma.inboundLead.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  // Group integrations by institute
  const institutesMap = new Map<
    string,
    {
      institute: (typeof integrations)[0]["institute"];
      integrations: typeof integrations;
      totalLeads: number;
      lastLeadAt: Date | null;
    }
  >();

  integrations.forEach((item: any) => {
    const existing = institutesMap.get(item.instituteId);
    if (existing) {
      existing.integrations.push(item);
      existing.totalLeads += item.totalLeadsReceived;
      if (item.lastLeadAt && (!existing.lastLeadAt || item.lastLeadAt > existing.lastLeadAt)) {
        existing.lastLeadAt = item.lastLeadAt;
      }
    } else {
      institutesMap.set(item.instituteId, {
        institute: item.institute,
        integrations: [item],
        totalLeads: item.totalLeadsReceived,
        lastLeadAt: item.lastLeadAt,
      });
    }
  });

  const connectedInstitutesList = Array.from(institutesMap.values());

  // Distinct institute options for filter dropdown
  const instituteOptions = connectedInstitutesList.map((c: any) => ({
    id: c.institute.id,
    name: c.institute.name,
  }));

  const activeIntegrationsCount = integrations.filter((i) => i.isActive).length;
  const googleCount = integrations.filter((i) => i.provider === "GOOGLE").length;
  const metaCount = integrations.filter((i) => i.provider === "META").length;
  const webhookCount = integrations.filter((i) => i.provider === "WEBSITE_WEBHOOK" || i.provider === "ZAPIER").length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-200">
              Premium CRM Channels
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-stone-100 text-stone-700">
              Isolated from Website Callbacks
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-3">
            <Share2 className="w-8 h-8 text-stone-700" />
            Ad & Webhook Lead Integrations
          </h1>
          <p className="text-sm text-stone-500 mt-1 font-medium max-w-2xl">
            Live overview of premium institutes capturing leads directly from Google Ads, Meta Ads & custom forms into AcademyFind CRM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/af-ass-manage/instituteCallbacks"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-700 transition shadow-xs"
          >
            <Phone className="w-3.5 h-3.5 text-stone-500" /> View Website Callbacks
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connected Institutes */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Connected Institutes
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900">
              {connectedInstitutesList.length}
            </span>
            <span className="text-xs font-semibold text-stone-500">institutes</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Active integrations configured
          </p>
        </div>

        {/* Active Channels */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Active Endpoints
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900">
              {activeIntegrationsCount}
            </span>
            <span className="text-xs font-semibold text-stone-500">
              of {integrations.length} active
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500 font-medium">
            <span className="text-red-600 font-bold">{googleCount} Google</span> ·
            <span className="text-blue-600 font-bold">{metaCount} Meta</span> ·
            <span className="text-emerald-600 font-bold">{webhookCount} Webhooks</span>
          </div>
        </div>

        {/* Total Captured Leads */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Total Ad Leads
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900">
              {totalLeadsCount}
            </span>
            <span className="text-xs font-semibold text-stone-500">leads captured</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            From connected ad campaigns
          </p>
        </div>

        {/* Leads Today */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Captured Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900">
              {todayLeadsCount}
            </span>
            <span className="text-xs font-semibold text-stone-500">since midnight</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Real-time webhook deliveries
          </p>
        </div>
      </div>

      {/* SECTION 1: Connected Institutes Directory */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-stone-700" />
              Connected Institutes ({connectedInstitutesList.length})
            </h2>
            <p className="text-xs text-stone-500">
              Institutes with active Google Ads, Meta Ads, or webhook endpoints.
            </p>
          </div>
        </div>

        {connectedInstitutesList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-stone-200 p-8 text-center">
            <p className="text-xs text-stone-500">
              No institutes have configured lead integrations yet. Premium institutes can set them up from their Manager Panel under "Lead Integrations".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedInstitutesList.map(({ institute, integrations, totalLeads, lastLeadAt }) => (
              <div
                key={institute.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 line-clamp-1">
                        {institute.name}
                      </h3>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-stone-400" />
                        {institute.city?.name || "N/A"}
                      </p>
                    </div>
                    {institute.subscriptionPlan && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                        {institute.subscriptionPlan}
                      </span>
                    )}
                  </div>

                  {/* Connected Providers List */}
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                      Active Sources ({integrations.length})
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {integrations.map((item: any) => {
                        if (item.provider === "GOOGLE") {
                          return (
                            <span
                              key={item.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-700 border border-red-100"
                            >
                              <SiGoogle className="w-2.5 h-2.5 text-[#EA4335]" /> Google Ads
                            </span>
                          );
                        }
                        if (item.provider === "META") {
                          return (
                            <span
                              key={item.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100"
                            >
                              <SiMeta className="w-2.5 h-2.5 text-[#0866FF]" /> Meta Ads
                            </span>
                          );
                        }
                        return (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"
                          >
                            <Code2 className="w-2.5 h-2.5 text-emerald-600" /> Webhook
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom stats & Quick Action */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-stone-500 font-medium">Leads: </span>
                    <span className="font-extrabold text-stone-900">{totalLeads}</span>
                    {lastLeadAt && (
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Last: {formatIST(lastLeadAt, "dd MMM, hh:mm a")}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/manager/${institute.id}/integrations`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-600 hover:text-stone-900 underline"
                  >
                    Open CRM <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Live Inbound Leads Feed & Explorer */}
      <div className="space-y-4 pt-4 border-t border-stone-200">
        <div>
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-stone-700" />
            Live Inbound Leads Explorer
          </h2>
          <p className="text-xs text-stone-500">
            Real-time feed of students captured through external Google/Meta campaigns. Filter by institute or provider.
          </p>
        </div>

        <InboundLeadsExplorer leads={leads as any} institutes={instituteOptions} />
      </div>
    </div>
  );
}
