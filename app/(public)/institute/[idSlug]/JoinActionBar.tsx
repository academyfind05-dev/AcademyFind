"use client";

import { useActionState, useState } from "react";
import { BookOpen, GraduationCap, Loader2, X } from "lucide-react";

import {
  cancelJoinRequest,
  requestStudentJoin,
  requestTeacherJoin,
  type JoinActionState,
} from "@/app/(public)/institute/[idSlug]/actions";

type MembershipStatus = "PENDING" | "ACTIVE" | "ALUMNI" | "REMOVED" | "REJECTED" | null;

interface JoinActionBarProps {
  instituteId: string;
  instituteName: string;
  isLoggedIn: boolean;
  studentStatus: MembershipStatus;
  studentMembershipId: string | null;
  teacherStatus: MembershipStatus;
  teacherMembershipId: string | null;
}

const INITIAL_STATE: JoinActionState = { success: false, message: "" };

export function JoinActionBar({
  instituteId,
  instituteName,
  isLoggedIn,
  studentStatus,
  studentMembershipId,
  teacherStatus,
  teacherMembershipId,
}: JoinActionBarProps) {
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const boundStudentJoin = requestStudentJoin.bind(null, instituteId);
  const boundTeacherJoin = requestTeacherJoin.bind(null, instituteId);

  const [studentState, studentAction, studentPending] = useActionState(
    boundStudentJoin,
    INITIAL_STATE,
  );
  const [teacherState, teacherAction, teacherPending] = useActionState(
    boundTeacherJoin,
    INITIAL_STATE,
  );

  const handleCancel = async (membershipId: string) => {
    setCancelling(membershipId);
    await cancelJoinRequest(membershipId);
    setCancelling(null);
  };

  const handleLoginRedirect = () => {
    window.location.href = `/login?callbackUrl=${encodeURIComponent(
      window.location.pathname,
    )}`;
  };

  // Close modals after success
  if (studentState.success && showStudentModal) setShowStudentModal(false);
  if (teacherState.success && showTeacherModal) setShowTeacherModal(false);

  return (
    <>
      {/* Join bar */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="mb-4 text-sm font-semibold text-amber-900">
            Are you associated with {instituteName}?
          </p>
          <div className="flex flex-wrap gap-3">
            {/* Student button */}
            <StudentJoinButton
              status={studentStatus}
              membershipId={studentMembershipId}
              isLoggedIn={isLoggedIn}
              cancelling={cancelling}
              onJoin={() =>
                isLoggedIn ? setShowStudentModal(true) : handleLoginRedirect()
              }
              onCancel={handleCancel}
            />

            {/* Teacher button */}
            <TeacherJoinButton
              status={teacherStatus}
              membershipId={teacherMembershipId}
              isLoggedIn={isLoggedIn}
              cancelling={cancelling}
              onJoin={() =>
                isLoggedIn ? setShowTeacherModal(true) : handleLoginRedirect()
              }
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>

      {/* Student modal */}
      {showStudentModal && (
        <Modal
          title="Join as Student"
          logo={null}
          instituteName={instituteName}
          onClose={() => setShowStudentModal(false)}
        >
          <form action={studentAction} className="space-y-4">
            <FormField
              label="Course / Batch Name"
              name="courseName"
              placeholder="e.g. JEE Advanced, NEET Foundation"
            />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Batch Year (Joined)"
                name="batchYear"
                options={range(2010, 2026)}
              />
              <SelectField
                label="Expected Passout"
                name="passoutYear"
                options={range(2024, 2032)}
              />
            </div>
            <TextareaField
              label="Bio (optional)"
              name="bio"
              placeholder="Tell future students about your experience..."
            />
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Did you find or join this institute through AcademyFind?
              </label>
              <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="radio" name="joinedViaAcademyFind" value="true" className="size-4 accent-amber-500" /> Yes
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="radio" name="joinedViaAcademyFind" value="false" className="size-4 accent-amber-500" defaultChecked /> No
                </label>
              </div>

              <Toggle
                name="isVisible"
                label="Show my profile in the student directory"
                defaultChecked
              />
              <Toggle
                name="allowMessaging"
                label="Allow others to message me about this institute"
                defaultChecked
              />
            </div>

            {studentState.message && !studentState.success && (
              <p className="text-sm text-rose-600">{studentState.message}</p>
            )}

            <button
              type="submit"
              disabled={studentPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-slate-900 hover:bg-amber-500 disabled:opacity-60"
            >
              {studentPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Submit Request →
            </button>
          </form>
        </Modal>
      )}

      {/* Teacher modal */}
      {showTeacherModal && (
        <Modal
          title="Join as Teacher"
          logo={null}
          instituteName={instituteName}
          onClose={() => setShowTeacherModal(false)}
        >
          <form action={teacherAction} className="space-y-4">
            <FormField
              label="Designation *"
              name="designation"
              placeholder="e.g. Senior Physics Faculty"
              required
            />
            <FormField
              label="Department"
              name="department"
              placeholder="e.g. Science Department"
            />
            <FormField
              label="Subjects you teach *"
              name="teachingSubjects"
              placeholder="Physics, Mechanics, Optics (comma-separated)"
              required
            />
            <TextareaField
              label="Bio (optional)"
              name="bio"
              placeholder="Describe your teaching experience..."
            />

            {teacherState.message && !teacherState.success && (
              <p className="text-sm text-rose-600">{teacherState.message}</p>
            )}

            <button
              type="submit"
              disabled={teacherPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-slate-900 hover:bg-amber-500 disabled:opacity-60"
            >
              {teacherPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Submit Request →
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function StudentJoinButton({
  status,
  membershipId,
  isLoggedIn,
  cancelling,
  onJoin,
  onCancel,
}: {
  status: MembershipStatus;
  membershipId: string | null;
  isLoggedIn: boolean;
  cancelling: string | null;
  onJoin: () => void;
  onCancel: (id: string) => void;
}) {
  if (status === "ACTIVE" || status === "ALUMNI") {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
        <GraduationCap className="size-4" />
        {status === "ACTIVE" ? "✓ You're a Student Here" : "Alumni"}
      </div>
    );
  }
  if (status === "PENDING" && membershipId) {
    return (
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600">
          <Loader2 className="size-4" />⏳ Student Request Pending
        </div>
        <button
          type="button"
          onClick={() => onCancel(membershipId)}
          disabled={cancelling === membershipId}
          className="text-sm text-slate-500 hover:text-rose-600"
        >
          {cancelling === membershipId ? "..." : "Cancel"}
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onJoin}
      className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-500"
    >
      <GraduationCap className="size-4" />
      {isLoggedIn ? "🎓 Join as Student" : "Join as Student"}
    </button>
  );
}

function TeacherJoinButton({
  status,
  membershipId,
  isLoggedIn,
  cancelling,
  onJoin,
  onCancel,
}: {
  status: MembershipStatus;
  membershipId: string | null;
  isLoggedIn: boolean;
  cancelling: string | null;
  onJoin: () => void;
  onCancel: (id: string) => void;
}) {
  if (status === "ACTIVE") {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
        <BookOpen className="size-4" /> ✓ You're a Teacher Here
      </div>
    );
  }
  if (status === "PENDING" && membershipId) {
    return (
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600">
          <Loader2 className="size-4" />⏳ Teacher Request Pending
        </div>
        <button
          type="button"
          onClick={() => onCancel(membershipId)}
          disabled={cancelling === membershipId}
          className="text-sm text-slate-500 hover:text-rose-600"
        >
          {cancelling === membershipId ? "..." : "Cancel"}
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onJoin}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      <BookOpen className="size-4" />
      {isLoggedIn ? "📚 Join as Teacher" : "Join as Teacher"}
    </button>
  );
}

function Modal({
  title,
  instituteName,
  onClose,
  children,
}: {
  title: string;
  logo: string | null;
  instituteName: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{instituteName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: number[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <select
        name={name}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        <option value="">Select year</option>
        {options.map((y: any) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <textarea
        name={name}
        rows={3}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={defaultChecked}
        className="size-4 rounded accent-amber-400"
      />
      {label}
    </label>
  );
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => end - i);
}
