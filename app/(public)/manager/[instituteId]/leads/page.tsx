import { prisma } from "@/lib/prisma";
import { Lock, MessageSquare, Phone, Calendar, ArrowRight, Repeat, Info, Globe, MessageCircle, ExternalLink, Zap } from "lucide-react";
import { SiMeta, SiGoogle, SiZapier } from "react-icons/si";
import Link from "next/link";
import { formatIST } from "@/lib/utils";
import { PLAN_LIMITS, PlanType } from "@/lib/plan_limits";

export default async function EnquiriesPage({
    params,
    searchParams,
}: {
    params: Promise<{ instituteId: string }>;
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const { instituteId } = await params;
    const sp = await searchParams;
    const currentSource = sp?.source || "ALL";

    const institute = await prisma.institute.findUnique({
        where: { id: instituteId },
        select: {
            id: true,
            name: true,
            subscriptionPlan: true,
        }
    });

    if (!institute) return <div className="p-8 text-center text-stone-500">Institute not found</div>;

    const limits = PLAN_LIMITS[institute.subscriptionPlan as PlanType];

    if (!limits.hasLeads) {
        return (
            <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-stone-50/50 rounded-3xl border border-dashed border-stone-200">
                <div className="w-16 h-16 bg-[#ebdbb7]/30 text-stone-800 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800 mb-2">Student Leads Locked</h2>
                <p className="text-stone-500 max-w-md mb-6">
                    Unlock direct student enquiries and lead generation from AcademyFind, Meta Ads, and Google Ads. Upgrade to the <b>Premium Plan</b> or <b>Ultra Plan</b>.
                </p>
                <Link href={`/manager/${instituteId}/subscription`} className="bg-stone-800 hover:bg-stone-900 text-white px-6 py-2.5 rounded-xl font-medium transition">
                    View Upgrade Plans
                </Link>
            </div>
        );
    }

    // Fetch both direct portal enquiries and inbound ad leads
    const [
        directEnquiries,
        inboundLeads,
        directCount,
        metaCount,
        googleCount,
        websiteCount,
        zapierCount
    ] = await Promise.all([
        prisma.instituteEnquiry.findMany({
            where: { instituteId },
            orderBy: { createdAt: "desc" },
        }),
        prisma.inboundLead.findMany({
            where: { instituteId },
            orderBy: { createdAt: "desc" },
        }),
        prisma.instituteEnquiry.count({ where: { instituteId } }),
        prisma.inboundLead.count({ where: { instituteId, source: "META_ADS" } }),
        prisma.inboundLead.count({ where: { instituteId, source: "GOOGLE_ADS" } }),
        prisma.inboundLead.count({ where: { instituteId, source: "WEBSITE_WEBHOOK" } }),
        prisma.inboundLead.count({ where: { instituteId, source: "ZAPIER" } }),
    ]);

    // Format and unify list
    const combinedLeads = [
        ...directEnquiries.map((e) => ({
            ...e,
            isDirectPortal: true,
            source: e.source || "ACADEMYFIND",
        })),
        ...inboundLeads.map((l) => ({
            ...l,
            isDirectPortal: false,
            source: l.source,
        })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const filteredLeads = combinedLeads.filter((item) => {
        if (currentSource === "ALL") return true;
        if (currentSource === "ACADEMYFIND") return item.isDirectPortal;
        return item.source === currentSource;
    });

    const totalCount = directCount + metaCount + googleCount + websiteCount + zapierCount;

    const sourceTabs = [
        { id: "ALL", label: "All Leads", count: totalCount },
        { id: "ACADEMYFIND", label: "AcademyFind Direct", count: directCount },
        { id: "META_ADS", label: "Meta Ads", count: metaCount },
        { id: "GOOGLE_ADS", label: "Google Ads", count: googleCount },
        { id: "WEBSITE_WEBHOOK", label: "Website Forms", count: websiteCount },
        { id: "ZAPIER", label: "Zapier / External", count: zapierCount },
    ];

    const getSourceBadge = (source: string) => {
        switch (source) {
            case "META_ADS":
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-0.5 rounded-full font-bold">
                        <SiMeta className="w-3 h-3 text-[#0866FF]" /> Meta Ads
                    </span>
                );
            case "GOOGLE_ADS":
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] bg-red-50 text-red-700 border border-red-200/80 px-2.5 py-0.5 rounded-full font-bold">
                        <SiGoogle className="w-3 h-3 text-[#EA4335]" /> Google Ads
                    </span>
                );
            case "WEBSITE_WEBHOOK":
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-bold">
                        <Globe className="w-3 h-3 text-emerald-600" /> Website Form
                    </span>
                );
            case "ZAPIER":
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] bg-orange-50 text-orange-700 border border-orange-200/80 px-2.5 py-0.5 rounded-full font-bold">
                        <SiZapier className="w-3 h-3 text-[#FF4A00]" /> Zapier / External
                    </span>
                );
            case "ACADEMYFIND":
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] bg-stone-100 text-stone-700 border border-stone-200/80 px-2.5 py-0.5 rounded-full font-bold">
                        <Globe className="w-3 h-3 text-stone-500" /> AcademyFind
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header with Quick Integration Link */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-stone-900 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-stone-800" /> Student Leads CRM
                    </h2>
                    <p className="text-sm text-stone-500 mt-1">
                        Unified inbox for direct student enquiries and leads from Meta, Google, and your website.
                    </p>
                </div>

                <Link
                    href={`/manager/${instituteId}/integrations`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition shrink-0 self-start sm:self-auto"
                >
                    <Zap className="w-3.5 h-3.5 text-amber-600" /> Connect Ads / Webhooks
                </Link>
            </div>

            {/* Source Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {sourceTabs.map((tab) => {
                    const isActive = currentSource === tab.id;
                    return (
                        <Link
                            key={tab.id}
                            href={`/manager/${instituteId}/leads${tab.id === "ALL" ? "" : `?source=${tab.id}`}`}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                isActive
                                    ? "bg-stone-900 text-white shadow-xs"
                                    : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                    isActive
                                        ? "bg-white/20 text-white"
                                        : "bg-stone-100 text-stone-600"
                                }`}
                            >
                                {tab.count}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Leads List */}
            {filteredLeads.length === 0 ? (
                <div className="p-12 text-center border border-stone-200 rounded-3xl bg-white shadow-2xs">
                    <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                    <h4 className="font-bold text-stone-800 text-sm">No enquiries found</h4>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                        {currentSource === "ALL"
                            ? "No enquiries received yet. Connect your Meta or Google Ads in the Integrations tab to automatically capture leads."
                            : `No leads captured from ${currentSource.replace("_", " ")} yet.`}
                    </p>
                    {currentSource !== "ALL" && (
                        <Link
                            href={`/manager/${instituteId}/leads`}
                            className="inline-block mt-3 text-xs font-bold text-stone-700 hover:underline"
                        >
                            View all leads →
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredLeads.map((enquiry: any) => {
                        const cleanPhone = (enquiry.phone || "").replace(/[^\d]/g, "");
                        const waNumber = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

                        return (
                            <div
                                key={enquiry.id}
                                className={`p-5 border rounded-2xl shadow-2xs bg-white transition-all hover:border-stone-400 ${
                                    enquiry.parentId ? "border-amber-200 hover:border-amber-300" : "border-stone-200"
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-base text-stone-900">{enquiry.name}</h3>
                                            {getSourceBadge(enquiry.source)}
                                            {enquiry.parentId && (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold tracking-wider">
                                                    <Repeat className="w-3 h-3" /> Forwarded Lead
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="inline-block text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold tracking-wider">
                                                {enquiry.status}
                                            </span>
                                            {enquiry.email && (
                                                <span className="text-xs text-stone-500 font-medium">
                                                    {enquiry.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0">
                                        <div className="text-xs text-stone-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {formatIST(enquiry.createdAt, "PPp")}
                                        </div>
                                        <Link
                                            href={`/manager/${instituteId}/leads/${enquiry.id}`}
                                            className="text-xs text-stone-800 hover:text-stone-950 font-bold flex items-center gap-1 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            View Details <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>

                                {enquiry.adminNote && (
                                    <div className="mb-3 text-xs bg-amber-50 border border-amber-100 text-amber-800 p-2.5 rounded-lg flex items-start gap-1.5">
                                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                        <span><b>Admin note:</b> {enquiry.adminNote}</span>
                                    </div>
                                )}

                                <p className="text-xs text-stone-700 bg-stone-50 border border-stone-100 p-3 rounded-xl mb-4 italic line-clamp-2">
                                    "{enquiry.message || "No message provided."}"
                                </p>

                                <div className="flex flex-wrap items-center gap-4 text-xs">
                                    {enquiry.phone && (
                                        <a
                                            href={`tel:${enquiry.phone}`}
                                            className="inline-flex items-center gap-1.5 font-bold text-stone-700 hover:text-stone-950 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
                                        >
                                            <Phone className="w-3.5 h-3.5 text-stone-600" /> {enquiry.phone}
                                        </a>
                                    )}

                                    {cleanPhone.length >= 10 && (
                                        <a
                                            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello ${enquiry.name}, thank you for reaching out to ${institute.name}. How can we help you with your course admission?`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl transition"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}