"use client";

import { useState, useMemo, useEffect } from "react";
import { format, addDays, addYears } from "date-fns";
import { CreditCard, QrCode, UploadCloud, Loader2, Ticket, CheckCircle2, X, ArrowDownCircle, Landmark } from "lucide-react";
import toast from "react-hot-toast";
import { submitPaymentProof } from "@/lib/User/manager/subscription";
import { Button } from "../ui/button";
import Image from "next/image";

export default function CheckoutForm({
  instituteId,
  plan,
  BillingCycle = "MONTHLY",
  upiId,
  bankDetails,
}: {
  instituteId: string;
  plan: any;
  BillingCycle?: "MONTHLY" | "ANNUAL";
  upiId: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
  };
}) {
  const [mounted, setMounted] = useState(false);
  const [isAnnual, setIsAnnual] = useState(BillingCycle === "ANNUAL");
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [failReason, setFailReason] = useState("");

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<"QR" | "BANK">("QR");

  // Coupon States
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Fix hydration mismatch by only rendering dates/prices on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🚀 Dynamic Pricing & Dates Calculation
  const { startDate, expiryDate, basePrice, finalPrice, discountAmount } = useMemo(() => {
    const start = mounted ? new Date() : new Date(0); // Dummy date for SSR
    const end = isAnnual ? addYears(start, 1) : addDays(start, 30);
    const amount = isAnnual ? plan.pricing.annual.offer : plan.pricing.monthly.offer;


    const discountPercent = appliedCoupon === "NOIDA10" ? 10 : 0;
    const discountVal = (amount * discountPercent) / 100;
    const discountedAmount = amount - discountVal;

    return {
      startDate: start,
      expiryDate: end,
      basePrice: amount,
      finalPrice: Math.round(discountedAmount),
      discountAmount: Math.round(discountVal)
    };
  }, [isAnnual, plan, appliedCoupon, mounted]);

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;

    if (couponInput.trim().toUpperCase() === "NOIDA10") {
      setAppliedCoupon("NOIDA10");
      toast.success("Coupon applied! 10% discount added.");
    } else {
      toast.error("Invalid or expired coupon code.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    toast.success("Coupon removed.");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    if (imageFile) formData.append("imageFile", imageFile);

    const res = await submitPaymentProof(instituteId, formData);
    if (res.success) {
      formElement.reset();
      setImagePreview("");
      setImageFile(null);
      setIsSuccessModalOpen(true);
    } else {
      setFailReason(res.error || "Something went wrong while submitting your payment proof.");
      setIsFailModalOpen(true);
    }
    setIsLoading(false);
  };

  if (!mounted) {
    return <div className="p-10 text-center text-slate-500">Initializing checkout...</div>;
  }

  return (
    // 🚀 Container padding and gap reduced (gap-10 -> gap-8, py-12 -> py-8)
    <div className="flex flex-col gap-8 max-w-3xl w-full mx-auto py-8 px-4 sm:px-6 relative">

      {/* FAILURE MODAL */}
      {isFailModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-10 h-10 text-rose-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Submission Failed</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              {failReason} Please check your connection and try again, or contact support if the issue persists.
            </p>
            <Button 
              onClick={() => setIsFailModalOpen(false)} 
              className="w-full py-4 text-base font-bold bg-rose-600 hover:bg-rose-700 rounded-xl"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Payment Under Review!</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Your payment proof has been successfully submitted. Our team will verify it and activate your <strong>{plan.name}</strong> plan shortly. You will be notified once the review is complete.
            </p>
            <Button 
              onClick={() => {
                setIsSuccessModalOpen(false);
                window.location.href = `/manager/${instituteId}/subscription`;
              }} 
              className="w-full py-4 text-base font-bold bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              Back to Subscriptions
            </Button>
          </div>
        </div>
      )}

      {/* 🟢 STEP 1: Order Summary (Scaled Down) */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-2 inline-block">Step 1 of 3</span>
            <h2 className="text-2xl font-bold text-slate-900">Order Summary</h2>
            <p className="text-sm text-slate-500">Review your plan and apply coupons.</p>
          </div>
          <div className="rounded-full bg-blue-50 p-3 hidden sm:block">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Inner block padding reduced (p-6 md:p-8 -> p-4 md:p-6, gap reduced) */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Plan Selected</p>
              <p className="text-lg font-bold text-slate-900">{plan.name}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm" // Smaller Shadcn size
              className="rounded-full text-xs font-bold"
              onClick={() => setIsAnnual(!isAnnual)}
            >
              Switch to {isAnnual ? "Monthly" : "Annual"}
            </Button>
          </div>

          <hr className="border-slate-200" />

          {/* Text size reduced (text-base -> text-sm, font-bold -> font-semibold) */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Start Date</span>
              <span className="font-semibold text-slate-900">{format(startDate, "PPP")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Expiry Date</span>
              <span className="font-semibold text-emerald-600">{format(expiryDate, "PPP")}</span>
            </div>
          </div>
        </div>

        {/* 🚀 COUPON SECTION (Inputs scaled down) */}
        <div className="mt-6">
          {!appliedCoupon ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Have a coupon code?"
                  // Input padding/font reduced (py-4 -> py-2.5, text-base -> text-sm)
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold uppercase placeholder:normal-case outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <Button onClick={handleApplyCoupon} size="sm" className="h-auto rounded-xl px-6 font-bold text-sm">Apply Code</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-800 uppercase tracking-wider">{appliedCoupon} Applied</span>
              </div>
              <button onClick={handleRemoveCoupon} className="p-1.5 hover:bg-emerald-100 rounded-full transition-colors">
                <X className="w-4 h-4 text-emerald-700" />
              </button>
            </div>
          )}
        </div>

        {/* TOTALS (Text size reduced) */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Base Price</span>
            <span className="font-semibold text-slate-700">₹{basePrice.toLocaleString("en-IN")}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-sm text-emerald-600 font-bold bg-emerald-50 p-1.5 rounded px-3 -mx-3">
              <span>Discount (10%)</span>
              <span>- ₹{discountAmount.toLocaleString("en-IN")}</span>
            </div>
          )}
          {/* Total Price text reduced (text-5xl -> text-3xl, pt-6 -> pt-4) */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-3">
            <span className="font-bold text-slate-800 text-lg">Total To Pay</span>
            <span className="text-3xl font-black text-blue-600">₹{finalPrice.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* 🟡 STEP 2: BIG QR CODE CARD (Keeping this Big & Prominent) */}
      <div className="rounded-3xl border border-slate-200 bg-slate-900 shadow-xl p-8 md:p-10 text-center relative overflow-hidden">
        {/* Glow reduced a bit */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-300 bg-blue-900/50 px-2.5 py-0.5 rounded-full mb-5 border border-blue-700/50">Step 2 of 3</span>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-2.5">
            <CreditCard className="w-7 h-7 text-blue-400" /> Pay Securely
          </h2>

          {/* PAYMENT METHOD TOGGLE */}
          <div className="flex bg-slate-800 p-1.5 rounded-xl mb-8 border border-slate-700 w-full max-w-sm">
            <button
              type="button"
              onClick={() => setPaymentMethod("QR")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-colors ${paymentMethod === "QR" ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              <QrCode className="w-4 h-4" /> Scan QR
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("BANK")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-colors ${paymentMethod === "BANK" ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              <Landmark className="w-4 h-4" /> Net Banking
            </button>
          </div>

          {paymentMethod === "QR" ? (
            <>
              {/* 🚀 KEEPING QR CONTAINER BIG (Original sizes) */}
              <div className="bg-white p-5 rounded-3xl mx-auto w-full max-w-90 sm:max-w-md aspect-square shadow-2xl">
                <Image
                  src="/payment_qr/payment.jpeg"
                  width={500}
                  height={500}
                  alt="Payment QR"
                  className="w-full h-full object-contain rounded-2xl"
                />
              </div>

              <div className="mt-8 space-y-2 w-full max-w-md mx-auto">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Official UPI ID</p>
                <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl w-full mx-auto overflow-hidden">
                  {/* Text size slightly reduced to fit box better */}
                  <p className="font-mono text-xl font-bold text-white tracking-wider select-all cursor-pointer hover:text-blue-300 transition-colors break-all">
                    {upiId}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* BANK DETAILS UI */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl w-full max-w-md mx-auto overflow-hidden text-left shadow-2xl mb-4">
                <div className="bg-blue-900/40 p-4 border-b border-slate-700 flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <Landmark className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{bankDetails?.bankName}</h3>
                    <p className="text-blue-300 text-xs uppercase tracking-wider font-semibold">Official Bank Account</p>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1.5">Account Name</p>
                    <p className="font-mono text-sm sm:text-base font-bold text-white tracking-wide select-all cursor-pointer hover:text-blue-300 transition-colors">
                      {bankDetails?.accountName}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1.5">Account Number</p>
                      <p className="font-mono text-base font-bold text-white tracking-wider select-all cursor-pointer hover:text-blue-300 transition-colors break-all">
                        {bankDetails?.accountNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1.5">IFSC Code</p>
                      <p className="font-mono text-base font-bold text-white tracking-wider select-all cursor-pointer hover:text-blue-300 transition-colors">
                        {bankDetails?.ifscCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Scroll instruction line (Text size reduced to standard) */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-center gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl w-full max-w-lg mx-auto text-center sm:text-left">
            <ArrowDownCircle className="w-7 h-7 text-amber-400 animate-bounce shrink-0" />
            <p className="text-sm font-semibold text-amber-300 leading-tight">
              After payment, scroll below to submit your payment proof for verification.
            </p>
          </div>
        </div>
      </div>

      {/* 🟢 STEP 3: Verification Form (Scaled Down) */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm w-full"
      >
        {/* Header section scaled down (mb-10 -> mb-6, pb-8 -> pb-6) */}
        <div className="mb-6 border-b border-slate-100 pb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-2 inline-block">Step 3 of 3</span>
          <h2 className="text-2xl font-bold text-slate-900">Verify Payment</h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload your proof and UTR number for admin review after making the payment of <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">₹{finalPrice.toLocaleString("en-IN")}</span>.
          </p>
        </div>

        <input type="hidden" name="planRequested" value={plan.id} />
        <input type="hidden" name="billingCycle" value={isAnnual ? "ANNUAL" : "MONTHLY"} />
        <input type="hidden" name="amountPaid" value={finalPrice} />

        {/* spacing reduced (space-y-8 -> space-y-6) */}
        <div className="space-y-6">
          <div className="space-y-1.5">
            {/* Label size standardized (text-sm -> text-xs uppercase) */}
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              12-Digit UTR / Transaction ID *
            </label>
            <input
              name="utrNumber"
              required
              placeholder="e.g. 412345678901"
              // Input scaled down (rounded-2xl -> rounded-xl, px-6 py-5 -> px-4 py-3, text-lg -> text-base)
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-mono outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Payment Screenshot (Optional, recommended)
            </label>
            {/* Upload area scaled down (rounded-3xl -> rounded-2xl, p-8 -> p-6) */}
            <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50/50">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  // constraints added
                  className="mx-auto mb-3 max-h-60 w-auto rounded-xl object-contain shadow-sm border border-slate-200"
                  alt="Payment Receipt Preview"
                />
              ) : (
                // inner text scaled down (text-lg -> text-sm)
                <div className="space-y-3 py-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-200">
                    <UploadCloud className="text-blue-500 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Click to upload receipt</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
            </label>
          </div>

          <Button
            disabled={isLoading}
            // Final button scaled down (text-xl -> text-base, py-8 -> py-4)
            className="w-full py-3 sm:py-4 text-sm sm:text-base font-bold rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2"><Loader2 className="animate-spin w-5 h-5" /> Submitting...</span>
            ) : (
              "Submit Proof for Verification"
            )}
          </Button>
        </div>
      </form>

    </div>
  );
}