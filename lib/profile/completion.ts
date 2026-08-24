type CompletionUser = {
  name: string | null;
  image: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  memberships?: Array<{ status: string; isActive: boolean }>;
  _count?: { reviews: number };
};

type CompletionProfile = {
  headline: string | null;
  bio: string | null;
} | null;

export function computeProfileCompletion(
  user: CompletionUser,
  studentProfile?: CompletionProfile,
  teacherProfile?: CompletionProfile,
) {
  const hasMembership = (user.memberships ?? []).some(
    (membership) =>
      membership.isActive &&
      (membership.status === "ACTIVE" || membership.status === "ALUMNI"),
  );
  const steps = [
    {
      id: "name",
      label: "Add your name",
      done: Boolean(user.name),
      points: 10,
      href: "/settings/profile",
    },
    {
      id: "photo",
      label: "Add a profile photo",
      done: Boolean(user.image),
      points: 15,
      href: "/settings/profile",
    },
    {
      id: "phone",
      label: "Add your phone number",
      done: Boolean(user.phone),
      points: 10,
      href: "/settings/profile",
    },
    {
      id: "headline",
      label: "Add a headline",
      done: Boolean(studentProfile?.headline || teacherProfile?.headline),
      points: 15,
      href: "/settings/profile",
    },
    {
      id: "bio",
      label: "Write your bio",
      done: Boolean(studentProfile?.bio || teacherProfile?.bio),
      points: 15,
      href: "/settings/profile",
    },
    {
      id: "social",
      label: "Add a social link",
      done: Boolean(
        user.linkedinUrl || user.twitterUrl || user.instagramUrl,
      ),
      points: 10,
      href: "/settings/account",
    },
    {
      id: "institute",
      label: "Join an institute",
      done: hasMembership,
      points: 15,
      href: "/search",
    },
    {
      id: "review",
      label: "Write your first review",
      done: (user._count?.reviews ?? 0) > 0,
      points: 10,
      href: "/search",
    },
  ];

  const score = steps
    .filter((step) => step.done)
    .reduce((total, step) => total + step.points, 0);

  return {
    score,
    nextStep: steps.find((step) => !step.done),
    steps,
    isComplete: steps.every((step) => step.done),
  };
}

import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/wallet/credit";
import { AF_COINS_EARN } from "@/lib/wallet/af-coins";

export async function checkAndAwardProfileCompletion(userId: string) {
  // Check if already awarded
  const existingTx = await prisma.walletTransaction.findFirst({
    where: {
      wallet: { userId },
      source: "COMPLETE_PROFILE",
    }
  });

  if (existingTx) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: { select: { status: true, isActive: true } },
      _count: { select: { reviews: true } }
    }
  });
  if (!user) return;

  const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
  const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId } });

  const { isComplete } = computeProfileCompletion(user as any, studentProfile, teacherProfile);

  if (isComplete) {
    await creditWallet(userId, AF_COINS_EARN.COMPLETE_PROFILE, "COMPLETE_PROFILE", "Profile completed");
  }
}
