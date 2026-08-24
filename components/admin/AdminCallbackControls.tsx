"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { deleteCallback, updateCallbackStatus, updateUserContactStatus } from "@/lib/User/admin/adminInstituteCallback";
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
  studentMessage
}: CallbackControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const statuses = ["NEW", "MESSAGED", "CALLED", "DNP", "JUNK"];

  // You can define different statuses for user contact if needed, here we use the same.
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

  const handleWhatsAppInstitute = () => {
    if (!institutePhone) return toast.error("Institute phone number is missing");

    // Clean phone number (remove spaces, symbols)
    const cleanPhone = institutePhone.replace(/\D/g, "");

    const instituteLink = instituteSlug ? `https://academyfind.com/institute/${id}-${instituteSlug}` : "https://academyfind.com";

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
    if (formattedPhone.startsWith("0")) {
      formattedPhone = formattedPhone.slice(1);
    }
    if (formattedPhone.length === 10) {
      formattedPhone = `91${formattedPhone}`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, "_blank");
  };

  const handleWhatsAppStudent = () => {
    if (!studentPhone) return toast.error("Student phone number is missing");

    // Clean phone number
    const cleanPhone = studentPhone.replace(/\D/g, "");

    const message = `Hi ${studentName || "Student"} \uD83D\uDC4B

Thank you for choosing AcademyFind! \uD83C\uDF93

Your enquiry for ${instituteName || "an institute"} has been shared with the institute. They've been requested to contact you shortly.

*Haven\u2019t heard back?* Reply *HELP* and the AcademyFind team will assist you.

With AcademyFind, you can discover, compare and connect with coaching institutes, tutors and learning centres across India \u2014 and make more informed decisions before joining.

Wishing you the best in your learning journey! \uD83C\uDF1F

Team AcademyFind
\uD83C\uDF10 www.academyfind.com
\uD83D\uDCDE 9045699938`;

    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith("0")) {
      formattedPhone = formattedPhone.slice(1);
    }
    if (formattedPhone.length === 10) {
      formattedPhone = `91${formattedPhone}`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-start justify-between gap-4 w-full">
        
        {/* Actions Container */}
        <div className="flex flex-wrap gap-4">
          
          {/* Student Section */}
          <div className="flex flex-col gap-2 p-3 bg-stone-50/80 rounded-xl border border-stone-100">
            <button
              onClick={handleWhatsAppStudent}
              disabled={!studentPhone}
              className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed w-fit"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Student
            </button>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase">Student Status</label>
              <select
                value={currentUserContactStatus || "NEW"}
                onChange={handleUserStatusChange}
                disabled={loading}
                className="bg-white border border-stone-200 text-stone-700 text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-stone-500 cursor-pointer"
              >
                {userStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Institute Section */}
          <div className="flex flex-col gap-2 p-3 bg-stone-50/80 rounded-xl border border-stone-100">
            <button
              onClick={handleWhatsAppInstitute}
              disabled={!institutePhone}
              className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed w-fit"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Institute
            </button>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase">Institute Status</label>
              <select
                value={currentStatus || "NEW"}
                onChange={handleStatusChange}
                disabled={loading}
                className="bg-white border border-stone-200 text-stone-700 text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-stone-500 cursor-pointer"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

        </div>

        {/* Delete Button */}
        <button
          onClick={() => setIsConfirmOpen(true)}
          disabled={loading}
          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg border border-red-100 transition shrink-0 mt-2 self-start"
          title="Delete Enquiry"
        >
          <Trash2 className="w-4 h-4" />
        </button>

      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeDelete}
        title="Delete Enquiry permanently?"
        description="This action cannot be undone. The enquiry will be removed."
        destructive={true}
        confirmText="Delete"
      />
    </div>
  );
}

