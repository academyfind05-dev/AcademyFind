import { notFound, redirect } from "next/navigation";

import type {
  BlogEditorInitialData,
  BlogEditorOptions,
} from "@/components/blog/editor/types";
import { getCachedSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

async function requireAdminPage() {
  const session = await getCachedSession();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  return session.user;
}

export async function getAdminBlogEditorOptions(): Promise<BlogEditorOptions> {
  await requireAdminPage();

  const [categories, tags, brands, authors] = await Promise.all([
    prisma.blogCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, icon: true },
    }),
    prisma.blogTag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.blogBrand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, avatarUrl: true },
    }),
    prisma.blogAuthorProfile.findMany({
      orderBy: { user: { name: "asc" } },
      select: { id: true, user: { select: { name: true, email: true } } },
    }),
  ]);

  return { categories, tags, brands, authors };
}

export async function getAdminBlogPost(
  postId: string,
): Promise<BlogEditorInitialData> {
  await requireAdminPage();

  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      contentHtml: true,
      coverImage: true,
      categoryId: true,
      brandId: true,
      metaTitle: true,
      metaDescription: true,
      focusKeyword: true,
      status: true,
      visibility: true,
      canonicalUrl: true,
      robotsIndex: true,
      robotsFollow: true,
      isFeatured: true,
      featuredOrder: true,
      isPinned: true,
      allowComments: true,
      scheduledAt: true,
      rejectionReason: true,
      relatedInstituteId: true,
      authorProfileId: true,
      tags: {
        select: {
          tag: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      faqs: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          question: true,
          answer: true,
          order: true,
        },
      },
    },
  });

  if (!post) notFound();
  return post;
}
