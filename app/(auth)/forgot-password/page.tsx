import { Metadata } from "next";
import ForgotPasswordComponent from "./ForgotPassword";
import { getPlatformStats } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Forgot Password | AcademyFind",
  description: "Reset your AcademyFind account password.",
  alternates: {
    canonical: "https://academyfind.com/forgot-password",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function ForgotPasswordPage() {
  const stats = await getPlatformStats();
  return <ForgotPasswordComponent stats={stats} />;
}

