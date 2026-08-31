import { prisma } from "@/lib/prisma";
import SalesRequestsAdminClient from "@/components/admin/SalesRequestsAdminClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales Assignment Requests | Admin Control Panel",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSalesRequestsPage() {
  const requests = await prisma.salesAssignmentRequest.findMany({
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
      salesManager: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
        },
      },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <SalesRequestsAdminClient initialRequests={requests as any} />
    </div>
  );
}
