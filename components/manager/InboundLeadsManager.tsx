"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Send,
  Zap,
  Globe,
  ExternalLink,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  SiMeta,
  SiGoogle,
  SiWordpress,
  SiZapier,
} from "react-icons/si";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  getInboundIntegrations,
  createInboundIntegration,
  updateInboundIntegration,
  deleteInboundIntegration,
  regenerateInboundApiKey,
  simulateTestLead,
} from "@/app/(public)/manager/[instituteId]/integrations/inbound-actions";
import Link from "next/link";

interface InboundLeadsManagerProps {
  instituteId: string;
}

const PROVIDERS = [
  {
    id: "META",
    name: "Meta (Facebook & Instagram)",
    description: "Sync instant lead ads from Facebook and Instagram campaigns.",
    icon: <SiMeta className="w-5 h-5 text-[#0866FF]" />,
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    guideTitle: "Meta Lead Ads Setup",
    guideSteps: [
      "Create or open your Lead Form in Meta Business Suite / Ads Manager.",
      "Copy your generated Webhook URL and API Key from this panel.",
      "Add the Webhook in Meta App settings or Business Lead Access Manager.",
      "Alternatively, enter your Page ID and Page Access Token below for automated sync.",
    ],
  },
  {
    id: "GOOGLE",
    name: "Google Ads Lead Forms",
    description: "Capture leads from Google Search, YouTube, and Display lead form assets.",
    icon: <SiGoogle className="w-5 h-5 text-[#EA4335]" />,
    badgeBg: "bg-red-50 text-red-700 border-red-200",
    guideTitle: "Google Ads Lead Form Extension Setup",
    guideSteps: [
      "In Google Ads, go to Campaigns -> Assets -> Lead Form.",
      "Scroll down to 'Export leads from Google Ads' -> Webhook integration.",
      "Paste the AcademyFind Webhook URL in the Webhook URL field.",
      "Paste your API Key in the Key field.",
      "Click 'Send test data' in Google Ads to verify the connection.",
    ],
  },
  {
    id: "WEBSITE_WEBHOOK",
    name: "Website & Landing Pages",
    description: "Capture inquiries from WordPress, Elementor, Webflow, or custom forms.",
    icon: <Globe className="w-5 h-5 text-emerald-600" />,
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    guideTitle: "Website / Landing Page Integration",
    guideSteps: [
      "In Elementor Form or WordPress form builder, set Action After Submit to 'Webhook'.",
      "Paste the Webhook URL below.",
      "Form fields (name, phone, email, course, message) will automatically map to AcademyFind.",
    ],
  },
  {
    id: "ZAPIER",
    name: "Zapier / Make / Pabbly",
    description: "Universal connector for LinkedIn Ads, Justdial, Sulekha, Typeform, & 1000+ apps.",
    icon: <SiZapier className="w-5 h-5 text-[#FF4A00]" />,
    badgeBg: "bg-orange-50 text-orange-700 border-orange-200",
    guideTitle: "Zapier & Universal Webhook Setup",
    guideSteps: [
      "Create a Zap in Zapier (Trigger: Your Lead App, e.g., LinkedIn Ads or Google Sheets).",
      "Action: Webhooks by Zapier -> 'POST'.",
      "URL: Paste the AcademyFind Webhook URL.",
      "Payload: Send student details (name, phone, email).",
    ],
  },
];

export default function InboundLeadsManager({ instituteId }: InboundLeadsManagerProps) {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(PROVIDERS[0]);
  const [integrationName, setIntegrationName] = useState("");
  const [metaPageId, setMetaPageId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, [instituteId]);

  const loadIntegrations = async () => {
    setIsLoading(true);
    const data = await getInboundIntegrations(instituteId);
    setIntegrations(data);
    setIsLoading(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const config: any = {};
    if (selectedProvider.id === "META") {
      if (metaPageId) config.metaPageId = metaPageId.trim();
      if (metaAccessToken) config.metaAccessToken = metaAccessToken.trim();
    }

    const res = await createInboundIntegration({
      instituteId,
      provider: selectedProvider.id,
      name: integrationName.trim() || `${selectedProvider.name} Campaign`,
      config,
    });

    if (res.success) {
      toast.success(`${selectedProvider.name} integration created!`);
      setShowAddModal(false);
      setIntegrationName("");
      setMetaPageId("");
      setMetaAccessToken("");
      loadIntegrations();
    } else {
      toast.error(res.error || "Failed to create integration");
    }
    setIsSubmitting(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await updateInboundIntegration(id, instituteId, { isActive: !currentStatus });
    if (res.success) {
      toast.success(`Integration ${!currentStatus ? "activated" : "paused"}`);
      loadIntegrations();
    } else {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    const toastId = toast.loading("Deleting integration...");
    const res = await deleteInboundIntegration(id, instituteId);
    if (res.success) {
      toast.success("Integration deleted", { id: toastId });
      loadIntegrations();
    } else {
      toast.error("Failed to delete", { id: toastId });
    }
  };

  const handleRegenerateKey = async (id: string) => {
    if (!confirm("Regenerating the API Key will break previous webhooks until you update them. Continue?")) {
      return;
    }
    const toastId = toast.loading("Regenerating API Key...");
    const res = await regenerateInboundApiKey(id, instituteId);
    if (res.success) {
      toast.success("New API Key generated!", { id: toastId });
      loadIntegrations();
    } else {
      toast.error("Failed to regenerate key", { id: toastId });
    }
  };

  const handleTestSimulation = async (id: string) => {
    setTestingId(id);
    const toastId = toast.loading("Sending test lead into AcademyFind CRM...");
    const res = await simulateTestLead(id, instituteId);
    if (res.success) {
      toast.success(res.message || "Test lead received!", { id: toastId, duration: 4000 });
      loadIntegrations();
    } else {
      toast.error(res.error || "Failed to send test lead", { id: toastId });
    }
    setTestingId(null);
  };

  const totalLeadsCaptured = integrations.reduce(
    (acc, curr) => acc + (curr.totalLeadsReceived || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Top Banner & Stats */}
      <div className="bg-linear-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Premium Inbound CRM Connectors
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">
              Capture Leads Automatically
            </h3>
            <p className="text-stone-300 text-sm max-w-xl">
              Connect your Meta (FB & Instagram) Ads, Google Ads lead forms, website landing pages, and Zapier to sync all your prospective student inquiries directly into your AcademyFind Manager CRM.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[120px]">
              <div className="text-2xl font-black text-amber-400">{totalLeadsCaptured}</div>
              <div className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider mt-0.5">Leads Captured</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[120px]">
              <div className="text-2xl font-black text-emerald-400">{integrations.filter(i => i.isActive).length}</div>
              <div className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider mt-0.5">Active Connectors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Quick Add Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-stone-900 text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" /> Supported Channels
          </h4>
          <span className="text-xs text-stone-500">Choose a channel to connect</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              className="border border-stone-200 bg-white rounded-2xl p-5 hover:border-stone-400 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 group-hover:scale-105 transition-transform">
                    {provider.icon}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${provider.badgeBg}`}>
                    Instant
                  </span>
                </div>
                <h5 className="font-bold text-stone-900 text-sm mb-1">{provider.name}</h5>
                <p className="text-xs text-stone-500 leading-relaxed mb-4">
                  {provider.description}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedProvider(provider);
                    setIntegrationName(`${provider.name} Campaign`);
                    setShowAddModal(true);
                  }}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold py-2 h-auto"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Connect {provider.id === "META" ? "Meta" : provider.id === "GOOGLE" ? "Google" : "Channel"}
                </Button>
                <button
                  type="button"
                  onClick={() => setActiveGuideId(activeGuideId === provider.id ? null : provider.id)}
                  className="w-full text-[11px] text-stone-500 hover:text-stone-800 font-medium py-1 flex items-center justify-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" /> How it works
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guide Accordion (if clicked) */}
      {activeGuideId && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-bold text-amber-950 text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              {PROVIDERS.find((p) => p.id === activeGuideId)?.guideTitle}
            </h5>
            <button
              onClick={() => setActiveGuideId(null)}
              className="text-xs text-amber-800 hover:underline font-semibold"
            >
              Close Guide
            </button>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-amber-900/90 leading-relaxed">
            {PROVIDERS.find((p) => p.id === activeGuideId)?.guideSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Active Connectors List */}
      <div className="border border-stone-200 bg-white rounded-3xl shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-stone-900 text-base">Connected Lead Sources</h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Manage your active webhook endpoints and test lead delivery.
            </p>
          </div>
          <Link
            href={`/manager/${instituteId}/leads`}
            className="text-xs font-bold text-stone-800 hover:text-stone-950 hover:underline flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 transition"
          >
            View Student Leads CRM →
          </Link>
        </div>

        <div className="divide-y divide-stone-100">
          {isLoading ? (
            <div className="p-10 text-center text-stone-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
              Loading connectors...
            </div>
          ) : integrations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3 border border-amber-100">
                <Zap className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-stone-800 text-sm">No connectors configured yet</h5>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                Click on any of the supported channels above (Meta Ads, Google Ads, or Website Form) to generate your first webhook connector.
              </p>
            </div>
          ) : (
            integrations.map((intg) => {
              const provConfig = PROVIDERS.find((p) => p.id === intg.provider) || {
                icon: <Zap className="w-5 h-5 text-stone-600" />,
                badgeBg: "bg-stone-100 text-stone-700 border-stone-200",
              };

              return (
                <div key={intg.id} className="p-5 sm:p-6 space-y-4 hover:bg-stone-50/50 transition">
                  {/* Top Header of item */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
                        {provConfig.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-stone-900 text-sm">{intg.name}</h5>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${provConfig.badgeBg}`}
                          >
                            {intg.provider}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              intg.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-200 text-stone-600"
                            }`}
                          >
                            {intg.isActive ? "● Active" : "Paused"}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-2">
                          <span>Captured: <strong className="text-stone-700">{intg.totalLeadsReceived} leads</strong></span>
                          {intg.lastLeadAt && (
                            <span>· Last lead: {new Date(intg.lastLeadAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* View Leads for this integration */}
                      <Link
                        href={`/manager/${instituteId}/leads?source=${
                          intg.provider === "META"
                            ? "META_ADS"
                            : intg.provider === "GOOGLE"
                            ? "GOOGLE_ADS"
                            : intg.provider === "WEBSITE_WEBHOOK"
                            ? "WEBSITE_WEBHOOK"
                            : intg.provider === "ZAPIER"
                            ? "ZAPIER"
                            : "ALL"
                        }`}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 transition flex items-center gap-1"
                      >
                        View Leads ({intg.totalLeadsReceived}) →
                      </Link>

                      {/* Test simulation button */}
                      <Button
                        size="sm"
                        variant="outline"
                        title="Simulates receiving a sample student inquiry to verify that your pipeline works without spending on real ads"
                        disabled={testingId === intg.id || !intg.isActive}
                        onClick={() => handleTestSimulation(intg.id)}
                        className="text-xs font-bold border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-xl h-8"
                      >
                        {testingId === intg.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        )}
                        Simulate Incoming Lead
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(intg.id, intg.isActive)}
                        className="text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl h-8"
                      >
                        {intg.isActive ? "Pause" : "Resume"}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirmId(intg.id)}
                        className="text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl h-8"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Webhook Endpoint & Key Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {/* Webhook URL */}
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                          Webhook URL (Paste in Google/Meta/Forms)
                        </span>
                        <button
                          onClick={() => handleCopy(intg.webhookUrl, `url-${intg.id}`)}
                          className="text-stone-600 hover:text-stone-900 text-xs font-semibold flex items-center gap-1"
                        >
                          {copiedKey === `url-${intg.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          Copy
                        </button>
                      </div>
                      <div className="font-mono text-xs text-stone-800 select-all truncate bg-white p-2 rounded border border-stone-200">
                        {intg.webhookUrl}
                      </div>
                    </div>

                    {/* API Secret Key */}
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                          API Key / Verification Secret
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRegenerateKey(intg.id)}
                            className="text-stone-400 hover:text-stone-700 text-xs"
                            title="Regenerate Key"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleCopy(intg.apiKey, `key-${intg.id}`)}
                            className="text-stone-600 hover:text-stone-900 text-xs font-semibold flex items-center gap-1"
                          >
                            {copiedKey === `key-${intg.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-stone-800 select-all truncate bg-white p-2 rounded border border-stone-200">
                        {intg.apiKey}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Connector Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-stone-100">
                  {selectedProvider.icon}
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-lg">Connect {selectedProvider.name}</h4>
                  <p className="text-xs text-stone-500">Configure your lead ingestion endpoint</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Connector / Campaign Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Batch FB Ads or Google NEET Campaign"
                  value={integrationName}
                  onChange={(e) => setIntegrationName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              {selectedProvider.id === "META" && (
                <div className="space-y-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <SiMeta className="w-3.5 h-3.5 text-[#0866FF]" /> Optional Meta Graph Sync
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    You can either connect via Webhook URL in Meta Business Suite, or enter your Page details below for automatic lead fetching:
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Facebook Page ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10293847561234"
                      value={metaPageId}
                      onChange={(e) => setMetaPageId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Meta Page Access Token (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="EAAGm0PXq..."
                      value={metaAccessToken}
                      onChange={(e) => setMetaAccessToken(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs text-stone-600 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  After creating this connector, you will get a unique Webhook URL and Secret Key. Any leads submitted to this URL will immediately show up under your <strong>Student Leads</strong> tab.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Creating...
                    </>
                  ) : (
                    "Create Connector"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Lead Connector?"
        description="Are you sure you want to delete this connector? External ads or webhooks using this URL will no longer be able to deliver leads to AcademyFind."
        confirmText="Delete"
        destructive
      />
    </div>
  );
}
