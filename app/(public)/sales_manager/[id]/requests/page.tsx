import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import SalesManagerRequestsClient from "@/components/sales/SalesManagerRequestsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assignment Requests | Sales Manager Control Panel",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SalesManagerRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [requests, categories] = await Promise.all([
    prisma.salesAssignmentRequest.findMany({
      where: { salesManagerId: id },
      orderBy: { createdAt: "desc" },
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            logo: true,
            city: { select: { name: true } },
            categories: { select: { category: { select: { name: true } } }, take: 2 },
          },
        },
        category: { select: { id: true, name: true, slug: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <SalesManagerRequestsClient
        salesManagerId={id}
        initialRequests={requests as any}
        categories={categories}
      />
    </div>
  );
}
