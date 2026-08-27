import type { Metadata } from "next";
import { redirect } from "next/navigation";

import BlogEditor from "@/components/blog/editor/BlogEditor";
import { getEditBlogData } from "@/lib/User/user/blog/geteditblogdata";

export const metadata: Metadata = {
  title: "Edit Post | AcademyFind Blog",
  description: "Edit and publish your AcademyFind blog post.",
  robots: {
    index: false,
    follow: false,
  },
};

type EditBlogPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = await params;
  const initialData = await getEditBlogData(id);

  if (!initialData) {
    redirect("/login");
  }

  return <BlogEditor mode="edit" initialData={initialData} />;
}
