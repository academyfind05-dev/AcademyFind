"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, MessageCircle, UserCheck, Shield, Sparkles, User, FileText } from "lucide-react";
import toast from "react-hot-toast";
import {
  deleteCallback,
  updateCallbackStatus,
  updateUserContactStatus,
  updateCallbackAdminNote,
  updateCallbackSalesManagerNote,
  assignCallbackToSalesManager,
} from "@/lib/User/admin/adminInstituteCallback";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface CallbackControlsProps {
  id: string;
  currentStatus: string;
  currentUserContactStatus?: string;
  studentName?: string;
  studentPhone?: string;
  instituteName?: string;
  institutePhone?: string;
  instituteSlug?: string;
  studentMessage?: string;
  adminNote?: string | null;
  salesManagerNote?: string | null;
  isSalesManager?: boolean;
  salesManagers?: { id: string; name: string | null; email: string }[];
  assignedSalesManagerId?: string | null;
  assignedSalesManagerName?: string | null;
  lastUpdatedByRole?: string | null;
  lastUpdatedByName?: string | null;
}

export default function CallbackControls({
  id,
  currentStatus,
  currentUserContactStatus = "NEW",
  studentName,
  studentPhone,
  instituteName,
  institutePhone,
  instituteSlug,
  studentMessage,
  adminNote,
  salesManagerNote,
  isSalesManager = false,
  salesManagers = [],
  assignedSalesManagerId,
  assignedSalesManagerName,
  lastUpdatedByRole,
  lastUpdatedByName,
}: CallbackControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // Notes State
  const [adminNoteContent, setAdminNoteContent] = useState(adminNote || "");
  const [salesNoteContent, setSalesNoteContent] = useState(salesManagerNote || "");
  const [savingAdminNote, setSavingAdminNote] = useState(false);
  const [savingSalesNote, setSavingSalesNote] = useState(false);

  // Sales Manager Assignment State
  const [selectedSalesManager, setSelectedSalesManager] = useState(assignedSalesManagerId || "");
  const [assigningSalesManager, setAssigningSalesManager] = useState(false);

  const statuses = ["NEW", "MESSAGED", "CALLED", "DNP", "JUNK"];
  const userStatuses = ["NEW", "MESSAGED", "CALLED", "DNP", "JUNK"];

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    const newStatus = e.target.value;
    const res = await updateCallbackStatus(id, newStatus);
    if (res.success) {
      toast.success("Institute Status updated!");
    } else {
      toast.error(res.error || "Failed");
    }
    setLoading(false);
  };

  const handleUserStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    const newStatus = e.target.value;
    const res = await updateUserContactStatus(id, newStatus);
    if (res.success) {
      toast.success("Student Status updated!");
    } else {
      toast.error(res.error || "Failed");
    }
    setLoading(false);
  };

  const handleAssignSalesManager = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newManagerId = e.target.value;
    setSelectedSalesManager(newManagerId);
    setAssigningSalesManager(true);
    const res = await assignCallbackToSalesManager(id, newManagerId || null);
    if (res.success) {
      toast.success(newManagerId ? "Assigned to Sales Manager!" : "Enquiry unassigned");
    } else {
      toast.error(res.error || "Failed to assign");
    }
    setAssigningSalesManager(false);
  };

  const executeDelete = async () => {
    setLoading(true);
    setIsConfirmOpen(false);
    const res = await deleteCallback(id);
    if (res.success) {
      toast.success("Enquiry deleted!");
      router.push("/af-ass-manage/instituteCallbacks");
    } else {
      toast.error(res.error || "Failed");
      setLoading(false);
    }
  };

  const handleSaveAdminNote = async () => {
    setSavingAdminNote(true);
    const res = await updateCallbackAdminNote(id, adminNoteContent);
    if (res.success) {
      toast.success("Admin note saved!");
    } else {
      toast.error(res.error || "Failed to save note");
    }
    setSavingAdminNote(false);
  };

  const handleSaveSalesNote = async () => {
    setSavingSalesNote(true);
    const res = await updateCallbackSalesManagerNote(id, salesNoteContent);
    if (res.success) {
      toast.success("Sales Manager note saved!");
    } else {
      toast.error(res.error || "Failed to save note");
    }
    setSavingSalesNote(false);
  };

  const handleWhatsAppInstitute = () => {
    if (!institutePhone) return toast.error("Institute phone number is missing");

    const cleanPhone = institutePhone.replace(/\D/g, "");
    const instituteLink = instituteSlug
      ? (instituteSlug.startsWith("http") ? instituteSlug : `https://academyfind.com/institute/${instituteSlug}`)
      : "https://academyfind.com";

    const message = `Hello ${instituteName || "Institute"} \uD83D\uDC4B

We received a student enquiry for your classes on AcademyFind from ${studentName || "a student"}. \uD83C\uDF93

Student would like to know:
${studentMessage || "Please contact me for more details."}

If ${studentName || "the student"} hasn't contacted you directly, reply to this message and we'll help facilitate the connection.

\uD83D\uDE80 Want more enquiries like this?

Claim your AcademyFind profile to receive student leads directly and build your institute's presence on India's education discovery platform.

\uD83D\uDD17 ${instituteLink}

Your AcademyFind profile can also serve as your online institute page.

Discover. Compare. Connect. Decide better.

Team AcademyFind
\uD83C\uDF10 www.academyfind.com | \uD83D\uDCDE 9045699938`;

    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith("0")) formattedPhone = formattedPhone.slice(1);
    if (formattedPhone.length === 10) formattedPhone = `91${formattedPhone}`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleWhatsAppStudent = () => {
    if (!studentPhone) return toast.error("Student phone number is missing");

    const cleanPhone = studentPhone.replace(/\D/g, "");

    const message = `Hi ${studentName || "Student"} \uD83D\uDC4B

Thank you for choosing AcademyFind! \uD83C\uDF93

Your enquiry for ${instituteName || "an institute"} has been shared with the institute. They've been requested to contact you shortly.

*Haven’t heard back?* Reply *HELP* and the AcademyFind team will assist you.

With AcademyFind, you can discover, compare and connect with coaching institutes, tutors and learning centres across India — and make more informed decisions before joining.

Wishing you the best in your learning journey! \uD83C\uDF1F

Team AcademyFind
\uD83C\uDF10 www.academyfind.com
\uD83D\uDCDE 9045699938`;

    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith("0")) formattedPhone = formattedPhone.slice(1);
    if (formattedPhone.length === 10) formattedPhone = `91${formattedPhone}`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 🚀 Admin Assignment & Attribution Header */}
      {!isSalesManager && salesManagers.length > 0 && (
        <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950">Assign to Sales Manager</p>
              <p className="text-[11px] text-indigo-600">Sales manager will see full enquiry details & updates</p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <select
              value={selectedSalesManager}
              onChange={handleAssignSalesManager}
              disabled={assigningSalesManager}
              className="w-full sm:w-auto bg-white border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
            >
              <option value="">Unassigned</option>
              {salesManagers.map((sm) => (
                <option key={sm.id} value={sm.id}>
                  {sm.name || sm.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Attribution Badge if status was updated */}
      {lastUpdatedByName && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium w-fit border border-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Last updated by: <strong>{lastUpdatedByName}</strong> ({lastUpdatedByRole === "SALES_MANAGER" ? "Sales Manager" : "Admin"})</span>
        </div>
      )}

      {/* Main Actions Container */}
      <div className="flex flex-wrap items-start justify-between gap-4 w-full">
        <div className="flex flex-wrap gap-4">
          
          {/* Student Outreach Section */}
          <div className="flex flex-col gap-2 p-3 bg-stone-50/80 rounded-2xl border border-stone-200">
            <button
              onClick={handleWhatsAppStudent}
              disabled={!studentPhone}
              className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed w-fit shadow-xs active:scale-95"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Student
            </button>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase">Student Status</label>
              <select
                value={currentUserContactStatus || "NEW"}
                onChange={handleUserStatusChange}
                disabled={loading}
                className="bg-white border border-stone-200 text-stone-700 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-stone-500 cursor-pointer"
              >
                {userStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Institute Outreach Section */}
          <div className="flex flex-col gap-2 p-3 bg-stone-50/80 rounded-2xl border border-stone-200">
            <button
              onClick={handleWhatsAppInstitute}
              disabled={!institutePhone}
              className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed w-fit shadow-xs active:scale-95"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Institute
            </button>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase">Institute Status</label>
              <select
                value={currentStatus || "NEW"}
                onChange={handleStatusChange}
                disabled={loading}
                className="bg-white border border-stone-200 text-stone-700 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-stone-500 cursor-pointer"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Delete Button (Admin Only) */}
        {!isSalesManager && (
          <button
            onClick={() => setIsConfirmOpen(true)}
            disabled={loading}
            className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl border border-red-200 transition shrink-0 mt-2 self-start active:scale-95"
            title="Delete Enquiry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 📝 Notes Grid (Admin Note + Sales Manager Note) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {/* 1. Admin Note Card */}
        <div className="flex flex-col gap-2 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/70">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-amber-800 uppercase flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              Admin Notes
            </label>
            {!isSalesManager && (
              <span className="text-[10px] bg-amber-200/60 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                Editable by Admin
              </span>
            )}
          </div>

          {!isSalesManager ? (
            <>
              <textarea
                value={adminNoteContent}
                onChange={(e) => setAdminNoteContent(e.target.value)}
                placeholder="Add internal admin notes about this enquiry here..."
                className="w-full bg-white border border-amber-200 rounded-xl p-3 text-xs text-stone-700 min-h-[85px] outline-none focus:ring-2 focus:ring-amber-500/30 resize-y"
              />
              <button
                onClick={handleSaveAdminNote}
                disabled={savingAdminNote || adminNoteContent === (adminNote || "")}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed w-fit self-end shadow-xs"
              >
                {savingAdminNote ? "Saving..." : "Save Admin Note"}
              </button>
            </>
          ) : (
            <div className="p-3 bg-white/80 rounded-xl border border-amber-100 text-xs text-stone-700 min-h-[85px]">
              {adminNote ? (
                <p className="whitespace-pre-wrap">{adminNote}</p>
              ) : (
                <p className="text-slate-400 italic">No admin notes added yet.</p>
              )}
            </div>
          )}
        </div>

        {/* 2. Sales Manager Note Card */}
        <div className="flex flex-col gap-2 p-4 bg-teal-50/50 rounded-2xl border border-teal-200/70">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-teal-800 uppercase flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              Sales Manager Notes
            </label>
            {isSalesManager && (
              <span className="text-[10px] bg-teal-200/60 text-teal-900 font-bold px-2 py-0.5 rounded-full">
                Editable by You
              </span>
            )}
          </div>

          {isSalesManager ? (
            <>
              <textarea
                value={salesNoteContent}
                onChange={(e) => setSalesNoteContent(e.target.value)}
                placeholder="Add your sales follow-up notes, call remarks or status details here..."
                className="w-full bg-white border border-teal-200 rounded-xl p-3 text-xs text-stone-700 min-h-[85px] outline-none focus:ring-2 focus:ring-teal-500/30 resize-y"
              />
              <button
                onClick={handleSaveSalesNote}
                disabled={savingSalesNote || salesNoteContent === (salesManagerNote || "")}
                className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed w-fit self-end shadow-xs"
              >
                {savingSalesNote ? "Saving..." : "Save Sales Note"}
              </button>
            </>
          ) : (
            <div className="p-3 bg-white/80 rounded-xl border border-teal-100 text-xs text-stone-700 min-h-[85px]">
              {salesManagerNote ? (
                <p className="whitespace-pre-wrap">{salesManagerNote}</p>
              ) : (
                <p className="text-slate-400 italic">No sales manager notes added yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {!isSalesManager && (
        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={executeDelete}
          title="Delete Enquiry permanently?"
          description="This action cannot be undone. The enquiry will be removed."
          destructive={true}
          confirmText="Delete"
        />
      )}
    </div>
  );
}
