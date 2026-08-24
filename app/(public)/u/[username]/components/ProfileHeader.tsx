"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BadgeCheck,
  Building2,
  Check,
  Copy,
  GraduationCap,
  MessageCircle,
  Pencil,
  Share2,
} from "lucide-react";

import type { CompletePublicProfile } from "@/lib/profile/queries";

export function ProfileHeader({
  profile,
  isOwnProfile,
}: {
  profile: any;
  isOwnProfile: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const headline =
    profile.teacherProfile?.headline ?? profile.studentProfile?.headline;
  const bio = profile.teacherProfile?.bio ?? profile.studentProfile?.bio;
  const roles = new Set(profile.memberships.map(({ role }: any) => role));
  const verified = profile.memberships.some(
    (m: any) =>
      m.studentRecord?.isVerified ||
      m.teacherRecord?.isVerified ||
      m.role === "MANAGER",
  );
  const joinedViaAcademyFind = profile.memberships.some(
    (m: any) => m.joinedViaAcademyFind,
  );

  const memberCount = profile._count?.memberships ?? profile.memberships.length;
  const reviewCount = profile._count?.reviews ?? 0;
  const reputationScore = profile.reputation?.score ?? 0;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/u/${profile.username}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${profile.name ?? profile.username} | AcademyFind`,
        url: `/u/${profile.username}`,
      });
    } else {
      handleCopyLink();
    }
  };

  const bioTruncated =
    bio && bio.length > 160 && !bioExpanded ? bio.slice(0, 160) + "…" : bio;

  return (
    <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Cover Image */}
      <div className="relative h-40 bg-gradient-to-br from-amber-100 via-white to-slate-100">
        {profile.coverImage ? (
          <Image
            src={profile.coverImage}
            alt=""
            fill
            priority
            className="object-cover"
          />
        ) : null}
        {isOwnProfile ? (
          <Link
            href="/settings/profile"
            className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm hover:bg-white"
          >
            <Pencil className="size-3" /> Edit cover
          </Link>
        ) : null}
      </div>

      <div className="relative px-6 pb-6 md:px-8">
        {/* Avatar */}
        <div
          className={`relative -mt-12 h-24 w-24 overflow-hidden rounded-full border-4 bg-slate-100 shadow-sm ${
            verified ? "border-amber-400" : "border-white"
          }`}
        >
          {profile.image ? (
            <Image
              src={profile.image}
              alt={profile.name ?? profile.username ?? "User"}
              fill
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-3xl font-bold text-slate-400">
              {(profile.name ?? "U").charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row">
          {/* Left — Name / Headline / Bio / Roles */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-3xl font-bold text-slate-950">
                {profile.name ?? "AcademyFind member"}
              </h1>
              {verified ? (
                <BadgeCheck className="size-6 shrink-0 text-emerald-500" />
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              @{profile.username}
            </p>

            {headline ? (
              <p className="mt-3 text-base font-medium text-slate-700">
                {headline}
              </p>
            ) : null}

            {bio ? (
              <div className="mt-2">
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  {bioTruncated}
                </p>
                {bio.length > 160 ? (
                  <button
                    type="button"
                    onClick={() => setBioExpanded((v) => !v)}
                    className="mt-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    {bioExpanded ? "Show less" : "Show more"}
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* Role badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {roles.has("STUDENT") ? (
                <RoleBadge
                  icon={GraduationCap}
                  label="Student"
                  color="blue"
                />
              ) : null}
              {roles.has("TEACHER") ? (
                <RoleBadge
                  icon={GraduationCap}
                  label="Teacher"
                  color="amber"
                />
              ) : null}
              {roles.has("MANAGER") ? (
                <RoleBadge icon={Building2} label="Manager" color="violet" />
              ) : null}
              {joinedViaAcademyFind ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-amber-500 text-white px-2.5 py-1 text-xs font-bold shadow-sm">
                  Joined via AcademyFind
                </span>
              ) : null}
            </div>

            {/* Stats bar */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span>
                <span className="font-bold text-slate-900">{memberCount}</span>{" "}
                institute{memberCount !== 1 ? "s" : ""}
              </span>
              <span className="text-slate-300">·</span>
              <span>
                <span className="font-bold text-slate-900">
                  {reputationScore.toLocaleString()}
                </span>{" "}
                rep
              </span>
              <span className="text-slate-300">·</span>
              <span>
                <span className="font-bold text-slate-900">{reviewCount}</span>{" "}
                review{reviewCount !== 1 ? "s" : ""}
              </span>
              <span className="text-slate-300">·</span>
              <span>
                Joined{" "}
                {profile.createdAt.toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Right — Actions */}
          <div className="flex shrink-0 flex-wrap items-start gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Share2 className="size-4" /> Share
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {copied ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copied!" : "Copy link"}
            </button>
            {!isOwnProfile && profile.allowDms ? (
              <Link
                href={`/chat?userId=${profile.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-500"
              >
                <MessageCircle className="size-4" /> Message
              </Link>
            ) : null}
            {isOwnProfile ? (
              <Link
                href="/settings/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Pencil className="size-4" /> Edit profile
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function RoleBadge({
  icon: Icon,
  label,
  color,
}: {
  icon: typeof GraduationCap;
  label: string;
  color: "blue" | "amber" | "violet";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${styles[color]}`}
    >
      <Icon className="size-3.5" /> {label}
    </span>
  );
}
