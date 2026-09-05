import { Metadata } from "next";
import LoginComponent from "./Login";
import { getPlatformStats } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Login to AcademyFind | Student & Institute Dashboard",
  description: "Access your AcademyFind account to shortlist top coaching institutes, manage your profile, write reviews, and book strategy calls.",
  alternates: {
    canonical: "https://academyfind.com/login",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Login | AcademyFind",
    description: "Access your AcademyFind dashboard.",
    url: "https://cademyfind.com/login",
    siteName: "AcademyFind",
    type: "website",
  },
};

export default async function LoginPage() {
  const stats = await getPlatformStats();

  return (
    <LoginComponent stats={stats} />
  );
}