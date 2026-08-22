"use client";

import { useState, useEffect } from "react";
import { MapPin, IndianRupee } from "lucide-react";
import { submitStudentEnquiry } from "@/lib/User/user/user-enquiry";
import toast from "react-hot-toast";
import { Button } from "../ui/button";
import CallBackSuccessPopUp from "@/components/User/CallBackFillPopUp";

type Props = {
  instituteId: string;
  instituteName?: string | null;
  feeInfo?: string | null;
  mapsUrl?: string | null;
  isLoggedIn?: boolean;
  defaultName?: string | null;
  defaultPhone?: string | null;
  defaultEmail?: string | null;
};

export default function InstituteEnquiryForm({
  instituteId,
  instituteName,
  feeInfo,
  mapsUrl,
  isLoggedIn = false,
  defaultName = "",
  defaultPhone = "",
  defaultEmail = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [name, setName] = useState(defaultName || "");
  const [mobile, setMobile] = useState(defaultPhone || "");
  const [email, setEmail] = useState(defaultEmail || "");
  const [msg, setmsg] = useState("");

  useEffect(() => {
    if (defaultName && !name) setName(defaultName);
    if (defaultPhone && !mobile) setMobile(defaultPhone);
    if (defaultEmail && !email) setEmail(defaultEmail);
  }, [defaultName, defaultPhone, defaultEmail]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("instituteId", instituteId);

    if (!name || !mobile) {
      toast.error("Please fill name and mobile to get a callback");
      setLoading(false);
      return;
    }
    try {
      const res = await submitStudentEnquiry(formData);
      if (res.success) {
        setShowPopup(true); // Show the popup instead of inline success
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to submit enquiry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Post-enquiry success popup */}
      <CallBackSuccessPopUp
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        isLoggedIn={isLoggedIn}
        instituteName={instituteName || undefined}
      />

      <div className="sticky top-24 rounded-3xl border bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold">Get Admission Guidance</h3>
        <p className="mt-2 text-sm text-slate-600">
          Connect directly with the institute for admission details.
        </p>

        {feeInfo && (
          <div className="mt-4 p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Fees</span>
            <span className="text-sm font-bold text-slate-800 flex items-center gap-0.5">
              <IndianRupee className="w-3.5 h-3.5" />{feeInfo}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
          <input
            required
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name*"
            className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 outline-none transition-all duration-300"
          />
          <div className="relative flex items-center w-full py-3 px-3 text-sm border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-400/20 transition-all duration-300">
            <input
              required
              name="phone"
              maxLength={10}
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              placeholder="Mobile* +91"
              className="peer order-2 flex-1 bg-transparent outline-none border-none min-w-0 p-0 text-slate-900 placeholder:text-slate-500 focus:placeholder:text-transparent"
            />
            <span className="hidden peer-focus:inline-block peer-[:not(:placeholder-shown)]:inline-block order-1 text-slate-900 font-medium whitespace-nowrap pointer-events-none mr-2">
              +91
            </span>
          </div>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (Optional)"
            className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 outline-none transition-all duration-300"
          />
          <textarea
            name="message"
            rows={3}
            value={msg}
            onChange={(e) => setmsg(e.target.value)}
            placeholder="Your Query (Optional)"
            className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 outline-none transition-all duration-300 resize-none"
          ></textarea>

          <Button
            disabled={loading}
            type="submit"
            className="w-full rounded-xl bg-amber-400 px-5 py-3.5 font-bold text-white transition hover:bg-amber-500 shadow-xs cursor-pointer mt-2"
          >
            {loading ? "Sending..." : "Get CallBack"}
          </Button>
        </form>

        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <button className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer">
              <MapPin className="h-4 w-4 text-slate-400" /> View on Maps
            </button>
          </a>
        )}
      </div>
    </>
  );
}