"use client";

import { useState } from "react";
import { SalesStatusBadge, InterestBadge } from "@/components/sales/SalesStatusBadge";
import SalesStatusUpdateForm from "@/components/sales/SalesStatusUpdateForm";
import {
  MapPin,
  CalendarDays,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { formatIST, generateInstituteWhatsAppMessage, formatWhatsAppNumber } from "@/lib/utils";

interface SalesAssignmentCardProps {
  assignment: any;
  isOverdue: boolean;
}

export default function SalesAssignmentCard({
  assignment,
  isOverdue,
}: SalesAssignmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedPhone = formatWhatsAppNumber(assignment.institute?.phone);
  const waText = encodeURIComponent(
    generateInstituteWhatsAppMessage(
      assignment.institute?.name || "Institute",
      assignment.institute?.slug,
      assignment.institute?.id
    )
  );

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all ${
        isOverdue
          ? "border-red-200 bg-red-50/30"
          : assignment.contactStatus === "UPGRADED"
          ? "border-violet-200 bg-violet-50/20"
          : assignment.contactStatus === "ONBOARDED"
          ? "border-emerald-200 bg-emerald-50/20"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg text-slate-800 truncate">
                {assignment.institute?.name}
              </h3>
              <SalesStatusBadge status={assignment.contactStatus} />
              {assignment.interest && (
                <InterestBadge interest={assignment.interest} />
              )}
              {isOverdue && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  Overdue
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {assignment.institute?.city?.name || "N/A"}
              </span>
              {assignment.institute?.categories?.[0] && (
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                  {assignment.institute.categories[0].category.name}
                </span>
              )}
              {assignment.deadline && (
                <span
                  className={`flex items-center gap-1 ${
                    isOverdue ? "text-red-600 font-bold" : ""
                  }`}
                >
                  <CalendarDays className="w-3 h-3" />
                  Deadline: {formatIST(assignment.deadline, "MMM dd, yyyy")}
                </span>
              )}
              {assignment.institute?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />{" "}
                  {assignment.institute.phone}
                </span>
              )}
              {assignment.institute?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />{" "}
                  {assignment.institute.email}
                </span>
              )}
            </div>

            {/* Action Buttons: WhatsApp & Call */}
            {assignment.institute?.phone && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <a
                  href={`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  <FaWhatsapp className="w-4 h-4" /> Message on WhatsApp
                </a>
                <a
                  href={`tel:${assignment.institute.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Institute
                </a>
              </div>
            )}

            {/* Area Assignment Tag */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md">
                <User className="w-3 h-3" /> ASSIGNED TO YOU
              </span>
              {assignment.areaAssignment && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md uppercase">
                  <MapPin className="w-3 h-3 text-rose-500" />{" "}
                  {assignment.areaAssignment.areaName} (
                  {assignment.areaAssignment.radiusKm} KM)
                </span>
              )}
            </div>

            {/* Address & Remark Display */}
            {assignment.institute?.address && (
              <p className="text-xs text-slate-600 mt-2 font-medium">
                📍 {assignment.institute.address}
              </p>
            )}
            {assignment.remark && (
              <p className="text-xs text-slate-500 mt-1 italic">
                Note: {assignment.remark}
              </p>
            )}
          </div>

          {/* Expand / Collapse Edit Button - Client-side toggle without URL navigation */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all self-start shrink-0 cursor-pointer ${
              isExpanded
                ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                : "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
            }`}
          >
            {isExpanded ? "Close" : "Update Status"}
          </button>
        </div>
      </div>

      {/* Inline Status Update Form */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-5 bg-slate-50/50 animate-in fade-in duration-200">
          <SalesStatusUpdateForm
            assignmentId={assignment.id}
            currentStatus={assignment.contactStatus}
            currentInterest={assignment.interest}
            currentRemark={assignment.remark}
            currentPlan={assignment.onboardedPlan}
          />
        </div>
      )}
    </div>
  );
}
