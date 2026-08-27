import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import BlogEditor from "@/components/blog/editor/BlogEditor";
import { getEditBlogData } from "@/lib/User/user/blog/geteditblogdata";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit Blog | Manager Dashboard",
  robots: { index: false, follow: false },
};

export default async function ManagerEditBlogPage(props: {
  params: Promise<{ instituteId: string; id: string }>;
}) {
  const { instituteId, id } = await props.params;

  const institute = await prisma.institute.findUnique({
    where: { id: instituteId },
    select: { subscriptionPlan: true },
  });

  if (!institute || (institute.subscriptionPlan !== "PREMIUM" && institute.subscriptionPlan !== "ULTRA")) {
    redirect(`/manager/${instituteId}/blogs`);
  }

  const initialData = await getEditBlogData(id);

  if (!initialData || initialData.relatedInstituteId !== instituteId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50/50 pb-12">
      <BlogEditor 
        mode="edit" 
        initialData={initialData} 
        management="manager" 
        relatedInstituteId={instituteId} 
      />
    </div>
  );
}
