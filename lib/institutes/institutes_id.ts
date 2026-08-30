import { prisma } from "@/lib/prisma";

const instituteInclude = {
  city: true,
  managers: true,
  facilities: true,
  faqs: true,
  notablepersons: true,
  achievements: true,
  operatingHours: { orderBy: { dayOfWeek: "asc" as const } },
  categories: {
    include: {
      category: true,
    },
  },
  reviews: {
    where: {
      status: "APPROVED" as const,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      replies: {
        where: {
          status: "APPROVED" as const,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc" as const,
        },
      },
    },
    orderBy: {
      createdAt: "desc" as const,
    },
  },
};

export async function getInstituteById(id: string) {
  if (!id) return null;

  // 1. Direct institute lookup by ID
  const institute = await prisma.institute.findUnique({
    where: { id },
    include: instituteInclude,
  });

  if (institute) return institute;

  // 2. Fallback: Check if ID was a callback/enquiry ID mistakenly used in WhatsApp links
  const enquiry = await prisma.instituteEnquiry.findUnique({
    where: { id },
    select: { instituteId: true },
  });

  if (enquiry?.instituteId) {
    const fromEnquiry = await prisma.institute.findUnique({
      where: { id: enquiry.instituteId },
      include: instituteInclude,
    });
    if (fromEnquiry) return fromEnquiry;
  }

  // 3. Fallback: Search by slug
  return prisma.institute.findFirst({
    where: {
      OR: [
        { slug: id },
        { slug: { contains: id } },
      ],
    },
    include: instituteInclude,
  });
}