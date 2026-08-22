import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { emailOTP } from "better-auth/plugins";
import { oneTap } from "better-auth/plugins";
import { Resend } from "resend";
import dotenv from 'dotenv';

dotenv.config();

// 1. Initialize Resend
// (Make sure RESEND_API_KEY is properly set in your .env file)
const resend = new Resend(process.env.RESEND_API_KEY!);

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    trustedOrigins: [
        "https://academyfind.com",
        "http://localhost:3000",
        "exp://",           // Expo development
        "academyfind://",   // Production deep link
    ],

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    // Map your custom columns so Better Auth exposes them to your sessions
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "USER",
            },
            phone: {
                type: "string",
                required: false,
            },
            onboardingCompleted: {
                type: "boolean",
                required: false,
                defaultValue: false,
            },
            isActive: {
                type: "boolean",
                required: false,
                defaultValue: true,
            },
            username: {
                type: "string",
                required: false,
            },
        },
    },
    // Optional: Boost performance by allowing Better Auth to use SQL joins (v1.4+)
    experimental: {
        joins: true, 
    },
    emailAndPassword: {  
        enabled: true,
        requireEmailVerification: true,
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    // Generate a random username if not provided
                    if (!user.username) {
                        const emailPrefix = user.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                        return {
                            data: {
                                ...user,
                                username: `${emailPrefix}${randomSuffix}`,
                            }
                        };
                    }
                    return { data: user };
                },
                after: async (user) => {
                    const { creditWallet } = await import("@/lib/wallet/credit");
                    await creditWallet(user.id, 5, "SIGN_UP", "Welcome Bonus for registering!");
                }
            }
        }
    },

    plugins:[
        emailOTP({
            async sendVerificationOTP({email, otp, type}){
                let subject = "";
                let htmlContent = "";

                // 2. Type ke hisaab se Email ka Text aur Subject set karo
                if(type === "sign-in"){
                    subject = "Your Login Code - AcademyFind";
                    htmlContent = `<p>Welcome back! Use the following code to sign in:</p>`;
                } else if(type === "email-verification"){
                    subject = "Verify Your Email - AcademyFind";
                    htmlContent = `<p>Welcome to AcademyFind! Please verify your email address using this code:</p>`;
                } else if(type === "forget-password"){
                    subject = "Reset Your Password - AcademyFind";
                    htmlContent = `<p>We received a request to reset your password. Use this code to proceed:</p>`;
                }

                const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?email=${encodeURIComponent(email)}&otp=${otp}&type=${type}`;

                // 3. Resend ko use karke Email bhejo
                try {
                    const result = await resend.emails.send({
                        from: 'AcademyFind <Verification@academyfind.com>', 
                        to: email,
                        subject: subject,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                                <h2 style="color: #f59e0b;">AcademyFind</h2>
                                ${htmlContent}
                                <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px; text-align: center;">
                                    <strong style="font-size: 28px; letter-spacing: 4px; color: #1f2937;">${otp}</strong>
                                </div>
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Verify Automatically</a>
                                    <p style="font-size: 12px; margin-top: 10px; color: #6b7280;">Or click this link: <a href="${verificationLink}" style="color: #3b82f6;">${verificationLink}</a></p>
                                </div>
                                <p style="font-size: 14px; color: #6b7280;">This code is valid for a limited time. Please do not share it with anyone.</p>
                            </div>
                        `,
                    });

                    if (result.error) {
                        console.error(`❌ Resend API Error:`, result.error);
                    } else {
                        console.log(`✅ Successfully sent ${type} OTP via Resend to ${email}`);
                    }
                    
                } catch (err) {
                    console.error(`❌ Failed to send ${type} email via Resend:`, err);
                }
            }
        }),
        oneTap()
    ]
});