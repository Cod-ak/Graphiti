import { NextRequest, NextResponse } from "next/server";
import { decodeGridRLE } from "@/app/lib/gridCodec";
import { generateClientScripts } from "@/app/lib/scriptGenerator";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const os = searchParams.get("os") === "sh" ? "sh" : "ps";
  const year = parseInt(searchParams.get("y") || "2026", 10) || 2026;
  const username = searchParams.get("u") || "";
  const repoName = searchParams.get("r") || "my-github-art";
  const speedMode = searchParams.get("m") === "deep" ? "deep" : "fast";
  const encodedGrid = searchParams.get("g") || "";

  if (!encodedGrid) {
    return new NextResponse("echo 'Error: Missing grid pattern parameter.'", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const grid = decodeGridRLE(encodedGrid);
  const { powershell, bash } = generateClientScripts(
    grid,
    year,
    repoName,
    username,
    speedMode,
    true
  );

  const body = os === "sh" ? bash : powershell;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
