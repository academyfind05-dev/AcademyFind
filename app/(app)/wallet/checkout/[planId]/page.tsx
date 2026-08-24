import CheckoutForm from "@/components/manager/CheckOutForm";
import { AFC_PRICING } from "@/lib/wallet/af-coins";
import { redirect } from "next/navigation";

export default async function WalletCheckoutPage({ params }: { params: Promise<{ planId: string }> }) {
    const { planId } = await params;

    const selectedPack = AFC_PRICING.find(p => p.id === planId);
    if (!selectedPack) {
        redirect("/wallet");
    }

    const upiId = process.env.PAYMENT_UPI_ID || "";
    const bankDetails = {
        bankName: process.env.PAYMENT_BANK_NAME || "",
        accountName: process.env.PAYMENT_ACCOUNT_NAME || "",
        accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER || "",
        ifscCode: process.env.PAYMENT_IFSC_CODE || ""
    };

    // Format the pack as a 'plan' object expected by CheckoutForm
    const formattedPlan = {
        id: selectedPack.id,
        name: `${selectedPack.afc} AF Coins Pack`,
        pricing: {
            monthly: { original: selectedPack.price, offer: selectedPack.price },
            annual: { original: selectedPack.price, offer: selectedPack.price }
        },
        desc: `Instantly credit ${selectedPack.afc} AF Coins to your wallet.`,
        features: [
            "Unlock contact details of any institute",
            "Message other students and teachers",
            "View hidden profiles",
            "Use for premium resume reviews and counselling"
        ]
    };

    return (
        <div className="py-10">
            <CheckoutForm 
                instituteId="wallet-recharge" // Just a placeholder, as it's not an institute subscription
                plan={formattedPlan} 
                BillingCycle="MONTHLY" 
                upiId={upiId} 
                bankDetails={bankDetails} 
            />
        </div>
    );
}
