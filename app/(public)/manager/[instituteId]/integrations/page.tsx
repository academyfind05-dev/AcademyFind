"use client";

import { useState, useEffect, use } from "react";
import { Plus, Trash2, Webhook, Zap, Loader2, CheckCircle2, Target, BarChart, Crosshair, Flame, Edit2, Lock, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { SiZoho, SiSalesforce, SiHubspot, SiZendesk } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { getIntegrations, createIntegration, updateIntegration, deleteIntegration, toggleIntegration, getInstitutePlan } from "./actions";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import Link from "next/link";
import InboundLeadsManager from "@/components/manager/InboundLeadsManager";

const PROVIDERS = [
  { id: "ZOHO", name: "Zoho CRM", logo: <SiZoho className="w-5 h-5" />, brandColor: "text-[#1161d7]" },
  { id: "SALESFORCE", name: "Salesforce", logo: <SiSalesforce className="w-5 h-5" />, brandColor: "text-[#00a1e0]" },
  { id: "HUBSPOT", name: "HubSpot", logo: <SiHubspot className="w-5 h-5" />, brandColor: "text-[#ff7a59]" },
  { id: "PIPEDRIVE", name: "Pipedrive", logo: <Target className="w-5 h-5" />, brandColor: "text-[#00aa55]" },
  { id: "LEADSQUARED", name: "LeadSquared", logo: <BarChart className="w-5 h-5" />, brandColor: "text-[#2a52be]" },
  { id: "NOCRM", name: "noCRM", logo: <Crosshair className="w-5 h-5" />, brandColor: "text-[#e31c26]" },
  { id: "ZENDESK", name: "Zendesk", logo: <SiZendesk className="w-5 h-5" />, brandColor: "text-[#03363d]" },
  { id: "FRESHSALES", name: "Freshsales", logo: <Flame className="w-5 h-5" />, brandColor: "text-[#ff4f4f]" },
  { id: "CUSTOM", name: "Custom Webhook", logo: <Webhook className="w-5 h-5" />, brandColor: "text-stone-700" },
];

export default function IntegrationsPage({ params }: { params: Promise<{ instituteId: string }> }) {
  const unwrappedParams = use(params);
  const instituteId = unwrappedParams.instituteId;

  const [integrations, setIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<string>("BASIC");
  const [activeTab, setActiveTab] = useState<"INBOUND" | "OUTBOUND">("INBOUND");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    provider: "ZOHO",
    webhookUrl: "",
    sendEnquiries: true,
    sendUserSaves: false,
    sendUserVisits: false,
  });

  useEffect(() => {
    fetchIntegrations();
  }, [instituteId]);

  const fetchIntegrations = async () => {
    setIsLoading(true);
    const fetchedPlan = await getInstitutePlan(instituteId);
    setPlan(fetchedPlan);
    const data = await getIntegrations(instituteId);
    setIntegrations(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.webhookUrl.trim()) return toast.error("Webhook URL is required");
    if (!formData.webhookUrl.startsWith("http")) return toast.error("Please enter a valid HTTP/HTTPS URL");

    setIsSubmitting(true);
    let res;
    if (editId) {
      res = await updateIntegration(editId, instituteId, formData);
    } else {
      res = await createIntegration({
        instituteId: instituteId,
        ...formData,
      });
    }

    if (res.success) {
      toast.success(editId ? "Integration updated!" : "Integration added successfully!");
      setShowForm(false);
      setEditId(null);
      setFormData({
        provider: "ZOHO",
        webhookUrl: "",
        sendEnquiries: true,
        sendUserSaves: false,
        sendUserVisits: false,
      });
      fetchIntegrations();
    } else {
      toast.error(res.error || "Failed to save integration");
    }
    setIsSubmitting(false);
  };

  const openEdit = (intg: any) => {
    setFormData({
      provider: intg.provider,
      webhookUrl: intg.webhookUrl,
      sendEnquiries: intg.sendEnquiries,
      sendUserSaves: intg.sendUserSaves,
      sendUserVisits: intg.sendUserVisits,
    });
    setEditId(intg.id);
    setShowForm(true);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    const toastId = toast.loading("Deleting...");
    const res = await deleteIntegration(id, instituteId);
    if (res.success) {
      toast.success("Deleted successfully", { id: toastId });
      fetchIntegrations();
    } else {
      toast.error("Failed to delete", { id: toastId });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const res = await toggleIntegration(id, !isActive, instituteId);
    if (res.success) {
      toast.success(`Integration ${!isActive ? "Enabled" : "Disabled"}`);
      fetchIntegrations();
    } else {
      toast.error("Failed to update status");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-stone-500">Loading integrations...</div>;
  }

  if (plan === "BASIC" || plan === "VERIFIED") {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="w-16 h-16 bg-[#ebdbb7]/30 text-stone-800 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-800 mb-2">Integrations Locked</h2>
        <p className="text-stone-500 max-w-md mb-6">
          Want to connect your Meta Ads, Google Ads, or CRM to automatically receive new student leads? Upgrade to the <b>Premium Plan</b> or <b>Ultra Plan</b>.
        </p>
        <Link href={`/manager/${instituteId}/subscription`} className="bg-stone-800 hover:bg-stone-900 text-white px-6 py-2.5 rounded-xl font-medium transition">
          View Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-center gap-3">
            <Zap className="w-7 h-7 text-amber-600" />
            Integrations & Lead Automation
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Capture prospective leads from Meta, Google, and your website, or export leads to your external CRM.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-stone-200/80 p-1 rounded-2xl shrink-0 self-start md:self-auto border border-stone-300/60 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("INBOUND")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "INBOUND"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-amber-600" />
            Capture Leads (Inbound)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("OUTBOUND")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "OUTBOUND"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <ArrowUpFromLine className="w-3.5 h-3.5 text-blue-600" />
            CRM Export (Outbound)
          </button>
        </div>
      </div>

      {activeTab === "INBOUND" ? (
        <InboundLeadsManager instituteId={instituteId} />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Outbound CRM Webhooks</h2>
              <p className="text-stone-500 text-xs mt-0.5">Automatically forward your AcademyFind leads to Zoho, Salesforce, or any CRM.</p>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="rounded-xl px-4 font-bold shadow-xs text-xs">
                <Plus className="w-4 h-4 mr-1.5" />
                New CRM Connection
              </Button>
            )}
          </div>

      {showForm && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-stone-800 mb-6">{editId ? "Edit Integration" : "Add Webhook Connection"}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-stone-700 mb-4">Select CRM Provider</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {PROVIDERS.map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => setFormData({ ...formData, provider: p.id })}
                      className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center transition-all ${formData.provider === p.id ? 'border-blue-600 bg-[#ebdbb7]/20/50 shadow-sm' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${formData.provider === p.id ? 'bg-blue-600 text-white' : `bg-stone-100 ${p.brandColor}`}`}>
                        {p.logo}
                      </div>
                      <span className="text-xs font-semibold text-stone-700 text-center">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-stone-700 mb-2">Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://crm.zoho.com/api/v2/Leads/webhook/..."
                  className="w-full border-stone-200 bg-stone-50 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  required
                />
                <p className="text-xs text-stone-500 mt-2">Generate a webhook URL from your CRM dashboard and paste it here.</p>
              </div>
            </div>

            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200">
              <h3 className="font-semibold text-stone-800 mb-4">Select Events to Forward</h3>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded text-stone-800 focus:ring-blue-500"
                    checked={formData.sendEnquiries}
                    onChange={(e) => setFormData({ ...formData, sendEnquiries: e.target.checked })}
                  />
                  <div>
                    <span className="block font-semibold text-stone-700 group-hover:text-stone-800 transition-colors">Institute Enquiries (Hot Leads)</span>
                    <span className="text-xs text-stone-500">Sent instantly when a user submits an enquiry for your institute.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded text-stone-800 focus:ring-blue-500"
                    checked={formData.sendUserSaves}
                    onChange={(e) => setFormData({ ...formData, sendUserSaves: e.target.checked })}
                  />
                  <div>
                    <span className="block font-semibold text-stone-700 group-hover:text-stone-800 transition-colors">Profile Saves (Warm Leads)</span>
                    <span className="text-xs text-stone-500">Sent when a logged-in user saves your institute profile to their list.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded text-stone-800 focus:ring-blue-500"
                    checked={formData.sendUserVisits}
                    onChange={(e) => setFormData({ ...formData, sendUserVisits: e.target.checked })}
                  />
                  <div>
                    <span className="block font-semibold text-stone-700 group-hover:text-stone-800 transition-colors">Profile Visits</span>
                    <span className="text-xs text-stone-500">Sent when a logged-in user visits your page. (May cause high data volume)</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditId(null); }} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl px-8 font-bold">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {editId ? "Update Integration" : "Save Integration"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : integrations.length === 0 ? (
        !showForm && (
          <div className="text-center py-20 bg-stone-50 rounded-3xl border border-dashed border-stone-300">
            <Webhook className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-stone-700">No Integrations Found</h3>
            <p className="text-stone-500 mt-2 max-w-sm mx-auto">Connect your favorite CRM to automatically receive leads from AcademyFind.</p>
            <Button onClick={() => setShowForm(true)} variant="outline" className="mt-6 rounded-xl">Add Connection</Button>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {integrations.map((intg: any) => (
            <div key={intg.id} className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${intg.isActive ? 'bg-emerald-50' : 'bg-stone-100'}`}>
                  <Webhook className={`w-6 h-6 ${intg.isActive ? 'text-emerald-600' : 'text-stone-400'}`} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 text-lg flex items-center gap-2">
                    {intg.provider}
                    {!intg.isActive && <span className="text-[10px] uppercase bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full">Disabled</span>}
                  </h4>
                  <p className="text-xs text-stone-500 font-mono mt-1 max-w-[200px] sm:max-w-xs md:max-w-md truncate">{intg.webhookUrl}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto border-t border-stone-100 md:border-none pt-4 md:pt-0">
                <div className="flex gap-2 flex-1 md:flex-none">
                  {intg.sendEnquiries && <span className="bg-[#ebdbb7]/20 text-stone-900 border border-blue-200 text-[10px] font-bold px-2 py-1 rounded-md">Enquiries</span>}
                  {intg.sendUserSaves && <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-1 rounded-md">Saves</span>}
                  {intg.sendUserVisits && <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-1 rounded-md">Visits</span>}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => handleToggle(intg.id, intg.isActive)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${intg.isActive ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                  >
                    {intg.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => openEdit(intg)}
                    className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-[#ebdbb7]/20 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(intg.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete integration"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Integration?"
        description="Are you sure you want to delete this integration? This action cannot be undone."
        confirmText="Delete"
        destructive
      />
        </div>
      )}
    </div>
  );
}
