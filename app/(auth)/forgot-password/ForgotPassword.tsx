"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2, Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PlatformStats } from "@/lib/stats";

export default function ForgotPasswordComponent({ stats }: { stats?: PlatformStats }) {
  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      });

      if (error) {
        toast.error(error.message || "Failed to send reset code.");
      } else {
        toast.success("Password reset code sent to your email!");
        setStep("otp");
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password,
      });

      if (error) {
        toast.error(error.message || "Failed to reset password.");
      } else {
        toast.success("Password reset successfully! You can now log in.");
        router.push("/login");
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
        {/* LEFT PANEL */}
        <div className="relative hidden w-1/2 overflow-hidden bg-linear-to-b from-amber-400 to-amber-500 p-12 text-white lg:flex lg:flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-lg shadow-amber-500/30 bg-white/90 backdrop-blur">
              <Image src="/logo.png" alt="AcademyFind Logo" width={120} height={120} />
            </div>
            <span className="font-semibold">
              AcademyFind
              <p className="text-[0.6rem]">Academy Search Simplified</p>
            </span>
          </div>

          {/* Content */}
          <div className="mt-24 max-w-sm">
            <h1 className="text-5xl font-bold leading-tight">
              Reset Your Password
            </h1>
            <p className="mt-5 text-orange-100">
              Get back to discovering, comparing and choosing India's best coaching institutes.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-14 flex flex-wrap gap-4">
            <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur-md">
              <p className="text-2xl font-bold">
                {stats?.instituteCount !== undefined
                  ? `${stats.instituteCount.toLocaleString("en-IN")}+`
                  : "41,000+"}
              </p>
              <p className="text-sm text-orange-100">Institutes</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur-md">
              <p className="text-2xl font-bold">
                {stats?.cityCount !== undefined
                  ? `${stats.cityCount.toLocaleString("en-IN")}+`
                  : "9+"}
              </p>
              <p className="text-sm text-orange-100">Cities</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur-md">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-white text-white" />
                <span className="text-2xl font-bold">
                  {stats?.avgRating !== undefined ? stats.avgRating.toFixed(1) : "4.6"}
                </span>
              </div>
              <p className="text-sm text-orange-100">Avg Rating</p>
            </div>
          </div>

          {/* Decorative Triangle */}
          <div className="absolute bottom-20 right-16 opacity-10">
            <div className="h-0 w-0 border-l-90 border-r-90 border-b-160 border-l-transparent border-r-transparent border-b-white" />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-1 items-center justify-center bg-[#fafafa] px-6 py-10">
          <div className="w-full max-w-md">
            {/* Logo Mobile */}
            <div className="mb-8 text-center lg:hidden">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg shadow-amber-500/30">
                <Image src="/logo.png" alt="AcademyFind Logo" width={120} height={120} />
              </div>
              <h3 className="text-sm font-bold tracking-[0.25em] text-slate-900">
                ACADEMYFIND
              </h3>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-amber-400">
                Reset Password
              </p>
            </div>

            {step === "email" ? (
              <div className="animate-in fade-in duration-300">
                <div className="mb-6 text-center">
                  <h2 className="text-3xl font-bold bg-linear-to-r from-amber-500 to-rose-200 bg-clip-text text-transparent">
                    Forgot Password?
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Enter your email to receive a password reset code.
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleSendOtp}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        required
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        Send Reset Code <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-amber-400 hover:text-amber-500"
                  >
                    Log In
                  </Link>
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-6 text-center">
                  <h2 className="text-3xl font-bold bg-linear-to-r from-amber-500 to-rose-200 bg-clip-text text-transparent">
                    Reset Password
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Enter the 6-digit code sent to <br />
                    <span className="font-semibold text-slate-800">{email}</span>
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleResetPassword}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      required
                      className="h-14 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-2xl font-semibold tracking-[0.5em] outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      New Password <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        required
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-12 text-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.length < 6 || password.length < 8}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-70 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Resetting...
                      </>
                    ) : (
                      "Set New Password"
                    )}
                  </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500">
                  Didn't receive the code?{" "}
                  <button
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="font-semibold text-amber-400 hover:text-amber-500 disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </p>

                <p className="mt-2 text-center text-sm text-slate-500">
                  <button
                    onClick={() => setStep("email")}
                    className="font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Change Email
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
