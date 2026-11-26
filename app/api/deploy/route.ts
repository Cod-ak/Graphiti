import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/app/lib/session";
import { calculateCommitPlan } from "@/app/lib/gridCodec";
import { pushArtCommitsToGitHub } from "@/app/lib/gitPack";

export async function POST(req: NextRequest) {
  // Basic CSRF origin check
  const origin = req.headers.get("origin");
  const reqOrigin = new URL(req.url).origin;
  if (origin && origin !== reqOrigin) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated with GitHub. Please sign in first." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const grid: number[][] = body.grid;
    const year: number = Number(body.year) || 2026;
    const speedMode: "fast" | "deep" =
      body.speedMode === "deep" ? "deep" : "fast";
    const repoName = String(body.repoName || "my-github-art")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .slice(0, 80);

    if (
      !repoName ||
      repoName.includes("..") ||
      repoName.startsWith(".") ||
      repoName.startsWith("-")
    ) {
      return NextResponse.json(
        { error: "Invalid repository name." },
        { status: 400 }
      );
    }

    const plan = calculateCommitPlan(grid, year, speedMode);
    if (plan.length === 0) {
      return NextResponse.json(
        { error: "Canvas is empty. Paint at least one square before deploying." },
        { status: 400 }
      );
    }

    // 1. Ensure repository exists on the user's GitHub account
    const repoCheck = await fetch(
      `https://api.github.com/repos/${session.login}/${repoName}`,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (repoCheck.status === 404) {
      const createRes = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: repoName,
          private: false,
          auto_init: false,
          description:
            "GitHub contribution graph pixel art created with Graphiti Studio",
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        return NextResponse.json(
          {
            error:
              errData.message ||
              `Failed to create repository '${repoName}' on GitHub.`,
          },
          { status: createRes.status }
        );
      }
    } else if (!repoCheck.ok) {
      return NextResponse.json(
        { error: "Could not access repository on GitHub." },
        { status: repoCheck.status }
      );
    }

    // 2. Push commit chain directly via Git Smart HTTP Packfile (Append Mode!)
    const pushResult = await pushArtCommitsToGitHub({
      owner: session.login,
      repo: repoName,
      token: session.token,
      authorName: session.name,
      authorEmail: session.email,
      plan,
    });

    return NextResponse.json({
      success: true,
      totalCommits: pushResult.totalCommits,
      activeDays: plan.length,
      appended: pushResult.appended,
      repoUrl: `https://github.com/${session.login}/${repoName}`,
      profileUrl: `https://github.com/${session.login}?tab=overview&from=${year}-01-01&to=${year}-12-31`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Deployment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
