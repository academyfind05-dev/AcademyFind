import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  Star,
} from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTelegram,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";

import { computeProfileCompletion } from "@/lib/profile/completion";
import type { CompletePublicProfile } from "@/lib/profile/queries";

const REPUTATION_LEVELS = [
  { label: "Explorer", min: 0, max: 20, color: "text-emerald-700" },
  { label: "Learner", min: 21, max: 50, color: "text-blue-600" },
  { label: "Scholar", min: 51, max: 100, color: "text-amber-500" },
  { label: "Mentor", min: 101, max: 500, color: "text-purple-600" },
  { label: "Champion", min: 501, max: Infinity, color: "text-red-600" },
];

function getLevel(score: number) {
  return (
    REPUTATION_LEVELS.find((l) => score >= l.min && score <= l.max) ??
    REPUTATION_LEVELS[0]
  );
}

function getNextLevel(score: number) {
  const idx = REPUTATION_LEVELS.findIndex(
    (l) => score >= l.min && score <= l.max,
  );
  return REPUTATION_LEVELS[idx + 1] ?? null;
}

export function ProfileSidebar({
  profile,
  isOwnProfile,
}: {
  profile: any;
  isOwnProfile: boolean;
}) {
  const completion = computeProfileCompletion(
    {
      name: profile.name,
      image: profile.image,
      phone: null, // not fetched in public profile
      linkedinUrl: profile.linkedinUrl,
      twitterUrl: profile.twitterUrl,
      instagramUrl: profile.instagramUrl,
      memberships: profile.memberships.map((m: any) => ({
        status: m.status,
        isActive: m.status === "ACTIVE" || m.status === "ALUMNI",
      })),
      _count: { reviews: profile._count?.reviews ?? 0 },
    },
    profile.studentProfile,
    profile.teacherProfile,
  );
  const reputation = profile.reputation?.score ?? 0;
  const level = getLevel(reputation);
  const nextLevel = getNextLevel(reputation);
  const reviewCount = profile._count?.reviews ?? 0;
  const blogCount = profile._count?.publishedPosts ?? profile.blogs.length;

  const hasSocials =
    profile.linkedinUrl ||
    profile.twitterUrl ||
    profile.instagramUrl ||
    profile.youtubeUrl ||
    profile.facebookUrl ||
    profile.telegramUrl ||
    profile.whatsappUrl;

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      {/* Profile completion (own profile only) */}
      {isOwnProfile ? (
        <section
          className={`rounded-2xl border p-5 shadow-sm ${
            completion.score < 80
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              Profile completion
            </h2>
            <span
              className={`font-bold ${
                completion.score >= 80 ? "text-emerald-600" : "text-amber-700"
              }`}
            >
              {completion.score}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completion.score >= 80 ? "bg-emerald-400" : "bg-amber-400"
              }`}
              style={{ width: `${completion.score}%` }}
            />
          </div>
          {completion.nextStep ? (
            <Link
              href={completion.nextStep.href}
              className="mt-3 flex items-center justify-between text-sm text-slate-600 hover:text-amber-700"
            >
              <span>Next: {completion.nextStep.label}</span>
              <ExternalLink className="size-3.5 shrink-0" />
            </Link>
          ) : (
            <p className="mt-3 text-sm font-medium text-emerald-600">
              🎉 Profile complete!
            </p>
          )}
        </section>
      ) : null}

      {/* Wallet (own profile only) */}
      {isOwnProfile ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              🪙 Coins
            </h2>
            <Link href="/wallet" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
              View Wallet →
            </Link>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {profile.wallet?.balance?.toLocaleString("en-IN") ?? 0} <span className="text-sm font-normal text-slate-500">balance</span>
          </p>
        </section>
      ) : null}

      {/* Overview stats */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <b className="block text-xl font-bold text-slate-950">
              {profile.memberships.length}
            </b>
            <span className="text-slate-500">Institutes</span>
          </div>
          <div>
            <b className="block text-xl font-bold text-slate-950">
              {blogCount}
            </b>
            <span className="text-slate-500">Blogs</span>
          </div>
          <div>
            <b className="block text-xl font-bold text-slate-950">
              {reviewCount}
            </b>
            <span className="text-slate-500">Reviews</span>
          </div>
        </div>
        <p className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <CalendarDays className="size-4 shrink-0" />
          Member since{" "}
          {profile.createdAt.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </section>

      {/* Reputation */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Star className="size-4 fill-amber-400 text-amber-400" /> Reputation
        </h2>
        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-3xl font-bold text-slate-950">
            {reputation.toLocaleString()}
          </p>
          <span className={`text-sm font-semibold ${level.color}`}>
            {level.label}
          </span>
        </div>
        {nextLevel ? (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{level.label}</span>
              <span>{nextLevel.label}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{
                  width: `${Math.min(
                    100,
                    ((reputation - level.min) / (nextLevel.min - level.min)) *
                      100,
                  )}%`,
                }}
              />
            </div>
          </div>
        ) : null}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          <div>
            <b className="block text-sm font-bold text-slate-900">
              {profile.reputation?.studentScore ?? 0}
            </b>
            Student
          </div>
          <div>
            <b className="block text-sm font-bold text-slate-900">
              {profile.reputation?.teacherScore ?? 0}
            </b>
            Teacher
          </div>
          <div>
            <b className="block text-sm font-bold text-slate-900">
              {profile.reputation?.managerScore ?? 0}
            </b>
            Manager
          </div>
        </div>
      </section>

      {/* Social links */}
      {hasSocials ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Connect
          </h2>
          <div className="flex flex-wrap gap-3">
            {profile.linkedinUrl ? (
              <SocialLink
                href={profile.linkedinUrl}
                icon={<FaLinkedin className="size-4" />}
                label="LinkedIn"
                color="text-blue-700 hover:text-blue-800"
              />
            ) : null}
            {profile.twitterUrl ? (
              <SocialLink
                href={profile.twitterUrl}
                icon={<FaTwitter className="size-4" />}
                label="Twitter"
                color="text-blue-400 hover:text-blue-500"
              />
            ) : null}
            {profile.instagramUrl ? (
              <SocialLink
                href={profile.instagramUrl}
                icon={<FaInstagram className="size-4" />}
                label="Instagram"
                color="text-pink-600 hover:text-pink-700"
              />
            ) : null}
            {profile.youtubeUrl ? (
              <SocialLink
                href={profile.youtubeUrl}
                icon={<FaYoutube className="size-4" />}
                label="YouTube"
                color="text-red-600 hover:text-red-700"
              />
            ) : null}
            {profile.facebookUrl ? (
              <SocialLink
                href={profile.facebookUrl}
                icon={<FaFacebook className="size-4" />}
                label="Facebook"
                color="text-blue-600 hover:text-blue-700"
              />
            ) : null}
            {profile.telegramUrl ? (
              <SocialLink
                href={profile.telegramUrl}
                icon={<FaTelegram className="size-4" />}
                label="Telegram"
                color="text-blue-500 hover:text-blue-600"
              />
            ) : null}
            {profile.whatsappUrl ? (
              <SocialLink
                href={profile.whatsappUrl}
                icon={<FaWhatsapp className="size-4" />}
                label="WhatsApp"
                color="text-green-600 hover:text-green-700"
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Institute list (compact) */}
      {profile.memberships.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Institutes
          </h2>
          <ul className="space-y-2">
            {profile.memberships.slice(0, 5).map((m: any) => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <Link
                  href={`/institute/${m.institute.id}-${m.institute.slug}`}
                  className="flex-1 truncate font-medium text-slate-800 hover:text-amber-700"
                >
                  {m.institute.name}
                </Link>
                <RolePill role={m.role} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}

function SocialLink({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`rounded-lg border border-slate-200 p-2 transition-colors hover:bg-slate-50 ${color}`}
    >
      {icon}
    </a>
  );
}

function RolePill({ role }: { role: string }) {
  const styles: Record<string, string> = {
    STUDENT: "bg-blue-50 text-blue-700 border-blue-200",
    TEACHER: "bg-amber-50 text-amber-700 border-amber-200",
    MANAGER: "bg-violet-50 text-violet-700 border-violet-200",
    ADMIN: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        styles[role] ?? styles.ADMIN
      }`}
    >
      {role}
    </span>
  );
}
