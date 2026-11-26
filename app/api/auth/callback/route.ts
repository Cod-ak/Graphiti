import { NextRequest, NextResponse } from "next/server";
import { encryptSession, SESSION_COOKIE_NAME } from "@/app/lib/session";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = req.cookies.get("graphiti_oauth_state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${origin}/?oauth_error=invalid_state`);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/?oauth_setup=required`);
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${origin}/api/auth/callback`,
    }),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return NextResponse.redirect(`${origin}/?oauth_error=token_exchange_failed`);
  }

  // Fetch GitHub user profile
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  const userData = await userRes.json();

  // Fetch verified emails so commits always link to the user's contribution graph
  let commitEmail = userData.email || "";
  const emailsRes = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (emailsRes.ok) {
    const emails: Array<{ email: string; primary: boolean; verified: boolean }> =
      await emailsRes.json();
    const primary = emails.find((e) => e.primary && e.verified);
    const anyVerified = emails.find((e) => e.verified);
    commitEmail = primary?.email || anyVerified?.email || commitEmail;
  }

  if (!commitEmail) {
    commitEmail = `${userData.id}+${userData.login}@users.noreply.github.com`;
  }

  const encrypted = encryptSession({
    token: accessToken,
    login: userData.login,
    name: userData.name || userData.login,
    email: commitEmail,
    avatar_url: userData.avatar_url || "",
  });

  const res = NextResponse.redirect(`${origin}/?connected=1`);
  res.cookies.delete("graphiti_oauth_state");
  res.cookies.set(SESSION_COOKIE_NAME, encrypted, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: origin.startsWith("https://"),
  });
  return res;
}
