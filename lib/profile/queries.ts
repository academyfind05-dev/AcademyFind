import { cache } from "react";

import { prisma } from "@/lib/prisma";

export const getPublicProfile = cache(async (username: string) =>
  prisma.user.findUnique({
    where: { username, isVisible: true, isActive: true },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      coverImage: true,
      emailVerified: true,
      allowDms: true,
      createdAt: true,
      facebookUrl: true,
      instagramUrl: true,
      telegramUrl: true,
      twitterUrl: true,
      youtubeUrl: true,
      linkedinUrl: true,
      whatsappUrl: true,
      studentProfile: {
        select: {
          id: true,
          headline: true,
          bio: true,
          targetExam: true,
          currentClass: true,
          isVisible: true,
        },
      },
      teacherProfile: {
        select: {
          id: true,
          headline: true,
          bio: true,
          qualification: true,
          experience: true,
          subjects: true,
          languages: true,
          isVisible: true,
          isVerified: true,
        },
      },
      reputation: {
        select: {
          score: true,
          studentScore: true,
          teacherScore: true,
          managerScore: true,
        },
      },
      wallet: {
        select: { balance: true },
      },
      _count: {
        select: { reviews: true, memberships: true, publishedPosts: true },
      },
      educations: { orderBy: { startDate: 'desc' } },
      experiences: { orderBy: { startDate: 'desc' } },
      achievements: { orderBy: { date: 'desc' } },
      skills: true,
    },
  }),
);

export const getProfileMemberships = cache(async (userId: string) =>
  prisma.instituteMembership.findMany({
    where: {
      userId,
      isActive: true,
      status: { in: ["ACTIVE", "ALUMNI"] },
    },
    orderBy: [{ status: "asc" }, { joinedAt: "desc" }],
    select: {
      id: true,
      role: true,
      status: true,
      joinedAt: true,
      joinedViaAcademyFind: true,
      institute: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          city: { select: { name: true, state: true } },
        },
      },
      studentRecord: {
        select: {
          courseName: true,
          batchYear: true,
          passoutYear: true,
          bio: true,
          isVerified: true,
          batchMemberships: {
            where: { isActive: true },
            select: { batch: { select: { id: true, name: true } } },
          },
        },
      },
      teacherRecord: {
        select: {
          designation: true,
          department: true,
          teachingSubjects: true,
          joinedOn: true,
          bio: true,
          isVerified: true,
          isFeatured: true,
          batchMemberships: {
            select: { batch: { select: { id: true, name: true } } },
          },
        },
      },
    },
  }),
);

export const getProfileBlogs = cache(async (userId: string) =>
  prisma.blogPost.findMany({
    where: {
      authorProfile: { userId },
      status: "PUBLISHED",
      visibility: "PUBLIC",
      deletedAt: null,
    },
    orderBy: { publishedAt: "desc" },
    take: 6,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      readingTime: true,
      viewCount: true,
      publishedAt: true,
      category: { select: { name: true } },
    },
  }),
);

export const getProfileReviews = cache(async (userId: string) =>
  prisma.review.findMany({
    where: { userId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      institute: {
        select: {
          name: true,
          slug: true,
          logo: true,
          city: { select: { name: true } },
        },
      },
    },
  }),
);

export async function getCompletePublicProfile(username: string) {
  const profile = await getPublicProfile(username);
  if (!profile) return null;
  const [memberships, blogs, reviews] = await Promise.all([
    getProfileMemberships(profile.id),
    getProfileBlogs(profile.id),
    getProfileReviews(profile.id),
  ]);
  return { ...profile, memberships, blogs, reviews };
}

export type CompletePublicProfile = NonNullable<
  Awaited<ReturnType<typeof getCompletePublicProfile>>
>;

export const getPrivateProfileData = cache(async (userId: string) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      canAddInstitute: true,
    }
  });

  if (!dbUser) return null;

  const authorProfile = await prisma.blogAuthorProfile.findUnique({
    where: { userId },
    select: { username: true, displayName: true },
  });

  const shortlistedItems = await prisma.userShortlist.findMany({
    where: { userId },
    include: { institute: { include: { city: true } } },
    orderBy: { createdAt: "desc" },
  });

  const historyItems = await prisma.userHistory.findMany({
    where: { userId },
    include: { institute: { include: { city: true } } },
    orderBy: { viewedAt: "desc" },
  });

  const managedInstitutes =
    dbUser.role === "INSTITUTE_MANAGER" || dbUser.role === "ADMIN"
      ? await prisma.instituteManager.findMany({
          where: { userId },
          include: { institute: { select: { id: true, name: true, slug: true } } },
        })
      : [];

  return {
    canAddInstitute: dbUser.canAddInstitute,
    role: dbUser.role,
    authorProfile,
    shortlistedItems,
    historyItems,
    managedInstitutes,
  };
});

