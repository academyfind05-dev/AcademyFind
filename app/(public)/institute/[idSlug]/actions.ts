"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/requireAuth";
import { notifyUser } from "@/lib/notifications/notify";
import { notifyAdmins } from "@/lib/notifications/notify";
import { prisma } from "@/lib/prisma";

const studentJoinSchema = z.object({
  courseName: z.string().trim().max(120).optional(),
  batchYear: z.coerce.number().int().min(2000).max(2035).optional(),
  passoutYear: z.coerce.number().int().min(2000).max(2040).optional(),
  bio: z.string().trim().max(500).optional(),
  isVisible: z.boolean().default(true),
  allowMessaging: z.boolean().default(true),
  joinedViaAcademyFind: z.boolean().default(false),
});

const teacherJoinSchema = z.object({
  designation: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  teachingSubjects: z
    .string()
    .optional()
    .transform((s) =>
      (s ?? "")
        .split(",")
        .map((t: any) => t.trim())
        .filter(Boolean),
    ),
  bio: z.string().trim().max(500).optional(),
});

export type JoinActionState = {
  success: boolean;
  message: string;
};

/** Student join request */
export async function requestStudentJoin(
  instituteId: string,
  _prev: JoinActionState,
  formData: FormData,
): Promise<JoinActionState> {
  const session = await requireAuth();

  const parsed = studentJoinSchema.safeParse({
    courseName: formData.get("courseName") || undefined,
    batchYear: formData.get("batchYear") || undefined,
    passoutYear: formData.get("passoutYear") || undefined,
    bio: formData.get("bio") || undefined,
    isVisible: formData.get("isVisible") !== "false",
    allowMessaging: formData.get("allowMessaging") !== "false",
    joinedViaAcademyFind: formData.get("joinedViaAcademyFind") === "true",
  });

  if (!parsed.success)
    return { success: false, message: "Please check the form fields." };

  // Check for existing student membership
  const existing = await prisma.instituteMembership.findFirst({
    where: { userId: session.user.id, instituteId, role: "STUDENT" },
  });
  if (existing) {
    return {
      success: false,
      message: "You already have a student request for this institute.",
    };
  }

  const institute = await prisma.institute.findUnique({
    where: { id: instituteId },
    select: { name: true, slug: true, managers: { select: { userId: true } } },
  });
  if (!institute) return { success: false, message: "Institute not found." };

  await prisma.$transaction(async (tx) => {
    // Upsert global student profile
    const studentProfile = await tx.studentProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });

    // Create membership
    const membership = await tx.instituteMembership.create({
      data: {
        userId: session.user.id,
        instituteId,
        role: "STUDENT",
        status: "PENDING",
        joinedViaAcademyFind: parsed.data.joinedViaAcademyFind,
      },
    });

    // Create student institute record
    await tx.studentInstituteRecord.create({
      data: {
        membershipId: membership.id,
        studentProfileId: studentProfile.id,
        instituteId,
        courseName: parsed.data.courseName,
        batchYear: parsed.data.batchYear,
        passoutYear: parsed.data.passoutYear,
        bio: parsed.data.bio,
        isVisible: parsed.data.isVisible,
        allowMessaging: parsed.data.allowMessaging,
      },
    });
  });

  // Notify managers
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, username: true },
  });

  await Promise.all([
    ...institute.managers.map((mgr: any) =>
      notifyUser(
        mgr.userId,
        "SYSTEM",
        "New student join request",
        `${user?.name ?? "A user"} wants to join ${institute.name} as a student.`,
        instituteId,
      ),
    ),
    notifyAdmins(
      "SYSTEM",
      "New student membership request",
      `${user?.name ?? "A user"} requested to join ${institute.name} as a student.`,
      `/af-ass-manage/memberships`,
      instituteId,
    ),
  ]);

  revalidatePath(`/institute/${instituteId}`);
  return {
    success: true,
    message: "Your request has been submitted! Waiting for approval.",
  };
}

/** Teacher join request */
export async function requestTeacherJoin(
  instituteId: string,
  _prev: JoinActionState,
  formData: FormData,
): Promise<JoinActionState> {
  const session = await requireAuth();

  const parsed = teacherJoinSchema.safeParse({
    designation: formData.get("designation") || undefined,
    department: formData.get("department") || undefined,
    teachingSubjects: formData.get("teachingSubjects") || "",
    bio: formData.get("bio") || undefined,
  });

  if (!parsed.success)
    return { success: false, message: "Please check the form fields." };

  const existing = await prisma.instituteMembership.findFirst({
    where: { userId: session.user.id, instituteId, role: "TEACHER" },
  });
  if (existing) {
    return {
      success: false,
      message: "You already have a teacher request for this institute.",
    };
  }

  const institute = await prisma.institute.findUnique({
    where: { id: instituteId },
    select: { name: true, slug: true, managers: { select: { userId: true } } },
  });
  if (!institute) return { success: false, message: "Institute not found." };

  await prisma.$transaction(async (tx) => {
    const teacherProfile = await tx.teacherProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });

    const membership = await tx.instituteMembership.create({
      data: {
        userId: session.user.id,
        instituteId,
        role: "TEACHER",
        status: "PENDING",
      },
    });

    await tx.teacherInstituteRecord.create({
      data: {
        membershipId: membership.id,
        teacherProfileId: teacherProfile.id,
        instituteId,
        designation: parsed.data.designation,
        department: parsed.data.department,
        teachingSubjects: parsed.data.teachingSubjects,
        bio: parsed.data.bio,
      },
    });
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  await Promise.all([
    ...institute.managers.map((mgr: any) =>
      notifyUser(
        mgr.userId,
        "SYSTEM",
        "New teacher join request",
        `${user?.name ?? "A user"} wants to join ${institute.name} as a teacher.`,
        instituteId,
      ),
    ),
    notifyAdmins(
      "SYSTEM",
      "New teacher membership request",
      `${user?.name ?? "A user"} requested to join ${institute.name} as a teacher.`,
      `/af-ass-manage/memberships`,
      instituteId,
    ),
  ]);

  revalidatePath(`/institute/${instituteId}`);
  return {
    success: true,
    message: "Your request has been submitted! Waiting for approval.",
  };
}

/** Cancel own join request */
export async function cancelJoinRequest(
  membershipId: string,
): Promise<{ success: boolean; message: string }> {
  const session = await requireAuth();

  const membership = await prisma.instituteMembership.findUnique({
    where: { id: membershipId },
    select: { userId: true, status: true, instituteId: true },
  });

  if (!membership || membership.userId !== session.user.id) {
    return { success: false, message: "Request not found." };
  }
  if (membership.status !== "PENDING") {
    return {
      success: false,
      message: "Only pending requests can be cancelled.",
    };
  }

  await prisma.instituteMembership.update({
    where: { id: membershipId },
    data: { status: "REJECTED", isActive: false },
  });

  revalidatePath(`/institute/${membership.instituteId}`);
  return { success: true, message: "Request cancelled." };
}

/** Respond to an invite (accept or decline) */
export async function respondToInvite(
  membershipId: string,
  accept: boolean,
): Promise<{ success: boolean; message: string }> {
  const session = await requireAuth();

  const membership = await prisma.instituteMembership.findUnique({
    where: { id: membershipId },
    select: {
      userId: true,
      status: true,
      instituteId: true,
      institute: { select: { name: true } },
    },
  });

  if (!membership || membership.userId !== session.user.id) {
    return { success: false, message: "Invite not found." };
  }

  if (accept) {
    const { handleMembershipApproval } = await import(
      "@/lib/membership/handleApproval"
    );
    await handleMembershipApproval(membershipId, session.user.id);
    return {
      success: true,
      message: `You've joined ${membership.institute.name}!`,
    };
  } else {
    await prisma.instituteMembership.update({
      where: { id: membershipId },
      data: { status: "REJECTED", isActive: false },
    });
    return { success: true, message: "Invite declined." };
  }
}

export async function getOrJoinBatchConversation(instituteId: string, batchId: string, batchName: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  // Verify access: Is Manager OR is BatchStudent OR is BatchTeacher
  const [manager, studentInBatch, teacherInBatch] = await Promise.all([
    prisma.instituteManager.findUnique({ where: { userId_instituteId: { userId, instituteId } } }),
    prisma.batchStudent.findFirst({ where: { batchId, studentRecord: { studentProfile: { userId }, instituteId } } }),
    prisma.batchTeacher.findFirst({ where: { batchId, teacherRecord: { teacherProfile: { userId }, instituteId } } })
  ]);

  const hasAccess = !!manager || !!studentInBatch || !!teacherInBatch;
  
  if (!hasAccess) {
    return { success: false, message: "Unauthorized" };
  }

  const { ensureBatchConversation } = await import("@/lib/chat/ensureBatchConversation");
  const conv = await ensureBatchConversation(instituteId, batchId, batchName);

  await prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId: conv.id, userId } },
    create: { conversationId: conv.id, userId, role: manager ? "MANAGER" : teacherInBatch ? "ADMIN" : "MEMBER" },
    update: { status: "ACTIVE", leftAt: null, isHidden: false },
  });

  return { success: true, conversationId: conv.id };
}
