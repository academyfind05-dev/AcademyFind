import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Google OAuth callback for mobile app.
 * Receives auth code from Google, exchanges for tokens, creates/finds user,
 * creates session, and redirects to app via deep link with the session token.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Handle user cancellation or errors
    if (error) {
      return redirectToApp(null, `Google login cancelled: ${error}`);
    }

    if (!code) {
      return redirectToApp(null, "No authorization code received from Google");
    }

    // Verify this is a mobile flow
    if (!state?.startsWith("mobile_")) {
      return redirectToApp(null, "Invalid state parameter");
    }

    // Exchange auth code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const redirectUri = `${baseUrl}/api/mobile/auth/google-callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return redirectToApp(null, "Failed to exchange authorization code");
    }

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userInfoResponse.json();

    if (!userInfoResponse.ok || !googleUser.email) {
      return redirectToApp(null, "Failed to get user info from Google");
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `${googleUser.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "")}${randomSuffix}`;

      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split("@")[0],
          image: googleUser.picture || null,
          username,
          emailVerified: googleUser.email_verified === true || googleUser.email_verified === "true",
        },
      });

      // Create Account linking
      if (googleUser.sub) {
        await prisma.account.create({
          data: {
            userId: user.id,
            providerId: "google",
            accountId: googleUser.sub,
          },
        });
      }
    } else {
      // Update user's image if they don't have one
      if (!user.image && googleUser.picture) {
        await prisma.user.update({
          where: { id: user.id },
          data: { image: googleUser.picture },
        });
      }
    }

    // Create session token (same pattern as phone-otp/verify)
    const rawToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const encoder = new TextEncoder();
    const data = encoder.encode(rawToken);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedToken = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    await prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        token: hashedToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: request.headers.get("user-agent") || "Mobile App",
      },
    });

    console.log(`✅ [MOBILE GOOGLE AUTH] User ${user.email} logged in successfully`);

    // Redirect back to app with token
    return redirectToApp(rawToken, null, user.name || undefined);
  } catch (error: any) {
    console.error("Google OAuth Callback Error:", error);
    return redirectToApp(null, error.message || "Google login failed");
  }
}

function redirectToApp(token: string | null, error: string | null, userName?: string) {
  const appScheme = "academyfindnative";
  const params = new URLSearchParams();

  if (token) {
    params.set("token", token);
    if (userName) params.set("name", userName);
  } else {
    params.set("error", error || "Unknown error");
  }

  const deepLink = `${appScheme}://auth-callback?${params.toString()}`;

  // Return an HTML page that auto-redirects to the deep link
  // This is more reliable than a 302 redirect for custom schemes
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecting to AcademyFind...</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
      display: flex; align-items: center; justify-content: center; 
      min-height: 100vh; margin: 0; background: #f9fafb; 
      text-align: center; padding: 20px;
    }
    .card { 
      background: white; border-radius: 16px; padding: 40px; 
      box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 400px;
    }
    h2 { color: #111827; margin-bottom: 8px; }
    p { color: #6b7280; margin-bottom: 24px; }
    a { 
      display: inline-block; background: #f59e0b; color: white; 
      padding: 12px 32px; border-radius: 12px; text-decoration: none; 
      font-weight: 700; font-size: 16px; 
    }
    .spinner { 
      width: 40px; height: 40px; border: 4px solid #f3f4f6; 
      border-top: 4px solid #f59e0b; border-radius: 50%; 
      animation: spin 1s linear infinite; margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>${token ? "Login Successful!" : "Login Failed"}</h2>
    <p>${token ? "Redirecting you back to AcademyFind app..." : (error || "Something went wrong")}</p>
    <a href="${deepLink}">Open AcademyFind App</a>
  </div>
  <script>
    // Auto redirect after a brief delay
    setTimeout(function() {
      window.location.href = "${deepLink}";
    }, 500);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
