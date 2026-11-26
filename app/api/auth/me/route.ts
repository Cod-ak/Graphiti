import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/app/lib/session";

export async function GET() {
  const configured = Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
  );
  const session = await getSessionFromCookies();

  if (!session) {
    return NextResponse.json({
      configured,
      authenticated: false,
      user: null,
    });
  }

  return NextResponse.json({
    configured,
    authenticated: true,
    user: {
      login: session.login,
      name: session.name,
      email: session.email,
      avatar_url: session.avatar_url,
    },
  });
}
