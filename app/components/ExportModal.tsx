"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  Terminal,
  ShieldCheck,
  Zap,
  Github,
  LogOut,
  ExternalLink,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { encodeGridRLE, calculateCommitPlan } from "@/app/lib/gridCodec";
import { generateClientScripts } from "@/app/lib/scriptGenerator";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  grid: number[][];
  targetYear: number;
  activeDays: number;
}

interface AuthState {
  loading: boolean;
  configured: boolean;
  authenticated: boolean;
  user: {
    login: string;
    name: string;
    email: string;
    avatar_url: string;
  } | null;
}

export default function ExportModal({
  isOpen,
  onClose,
  grid,
  targetYear,
  activeDays,
}: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<"cloud" | "cli">("cloud");
  const [platform, setPlatform] = useState<"powershell" | "bash">("powershell");
  const [speedMode, setSpeedMode] = useState<"fast" | "deep">("fast");
  const [repoName, setRepoName] = useState("my-github-art");
  const [cliUsername, setCliUsername] = useState("");
  const [copiedOneLiner, setCopiedOneLiner] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  const [auth, setAuth] = useState<AuthState>({
    loading: true,
    configured: false,
    authenticated: false,
    user: null,
  });

  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<{
    totalCommits: number;
    appended: boolean;
    repoUrl: string;
    profileUrl: string;
  } | null>(null);

  // Fetch OAuth status whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    setDeployError(null);
    setDeployResult(null);

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAuth({
            loading: false,
            configured: Boolean(data.configured),
            authenticated: Boolean(data.authenticated),
            user: data.user || null,
          });
          if (data.user?.login && !cliUsername) {
            setCliUsername(data.user.login);
          }
          // Default to CLI tab automatically if OAuth isn't configured on server yet
          if (!data.configured) {
            setActiveTab("cli");
          }
        } else {
          setAuth((prev) => ({ ...prev, loading: false }));
        }
      })
      .catch(() => {
        setAuth((prev) => ({ ...prev, loading: false }));
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const plan = calculateCommitPlan(grid, targetYear, speedMode);
  const totalCommits = plan.reduce((acc, p) => acc + p.count, 0);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const encodedGrid = encodeGridRLE(grid);
  const safeUser = cliUsername.trim();
  const safeRepo = repoName.trim() || "my-github-art";

  const scriptParams = new URLSearchParams({
    os: platform === "powershell" ? "ps" : "sh",
    y: String(targetYear),
    r: safeRepo,
    m: speedMode,
    g: encodedGrid,
  });
  if (safeUser) {
    scriptParams.set("u", safeUser);
  }

  const scriptUrl = `${origin}/api/script?${scriptParams.toString()}`;
  const oneLiner =
    platform === "powershell"
      ? `irm "${scriptUrl}" | iex`
      : `curl -sL "${scriptUrl}" | bash`;

  const { powershell, bash } = generateClientScripts(
    grid,
    targetYear,
    safeRepo,
    safeUser,
    speedMode,
    true
  );
  const fullScript = platform === "powershell" ? powershell : bash;

  const handleCopyOneLiner = () => {
    navigator.clipboard.writeText(oneLiner);
    setCopiedOneLiner(true);
    setTimeout(() => setCopiedOneLiner(false), 2000);
  };

  const handleCopyFull = () => {
    navigator.clipboard.writeText(fullScript);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleDownload = () => {
    const filename = platform === "powershell" ? "run_art.ps1" : "run_art.sh";
    const blob = new Blob([fullScript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSignInGitHub = () => {
    // Save canvas & year before OAuth redirect so design is preserved
    try {
      localStorage.setItem(
        "graphiti_pending_art",
        JSON.stringify({ grid, targetYear })
      );
    } catch {}
    window.location.href = "/api/auth/github";
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuth((prev) => ({ ...prev, authenticated: false, user: null }));
    setDeployResult(null);
  };

  const handleCloudDeploy = async () => {
    setDeploying(true);
    setDeployError(null);
    setDeployResult(null);

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grid,
          year: targetYear,
          repoName: safeRepo,
          speedMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deployment failed");
      }
      setDeployResult(data);
    } catch (err: unknown) {
      setDeployError(
        err instanceof Error ? err.message : "Failed to deploy commits"
      );
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#238636]/20 border border-[#238636]/30 text-[#39d353]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Paint to Your GitHub Profile
              </h2>
              <p className="text-xs text-[#8b949e]">
                Append Mode: safely adds {targetYear} onto{" "}
                <span className="text-white font-mono">{safeRepo}</span> without wiping past years
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-[#8b949e]">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#0d1117] p-3 rounded-xl border border-[#30363d]">
              <span className="text-[11px] text-[#8b949e]">Target Year</span>
              <p className="text-base font-bold text-[#58a6ff]">{targetYear}</p>
            </div>
            <div className="bg-[#0d1117] p-3 rounded-xl border border-[#30363d]">
              <span className="text-[11px] text-[#8b949e]">Active Days</span>
              <p className="text-base font-bold text-white">{activeDays}</p>
            </div>
            <div className="bg-[#0d1117] p-3 rounded-xl border border-[#30363d]">
              <span className="text-[11px] text-[#8b949e]">Total Commits</span>
              <p className="text-base font-bold text-[#39d353]">{totalCommits}</p>
            </div>
          </div>

          {/* Shared Repo & Speed Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d]">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#8b949e]">
                Target Repository Name
              </label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="my-github-art"
                className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#238636] text-white px-3 py-1.5 rounded-lg text-xs font-mono focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#8b949e]">
                Commit Density
              </label>
              <div className="flex bg-[#161b22] p-1 rounded-lg border border-[#30363d]">
                <button
                  onClick={() => setSpeedMode("fast")}
                  className={`flex-1 py-1 rounded text-[11px] font-medium transition-all ${
                    speedMode === "fast"
                      ? "bg-[#238636] text-white"
                      : "text-[#8b949e] hover:text-white"
                  }`}
                  title="1-4 commits/day (60% faster, identical shades on clean years)"
                >
                  Fast (1-4/day)
                </button>
                <button
                  onClick={() => setSpeedMode("deep")}
                  className={`flex-1 py-1 rounded text-[11px] font-medium transition-all ${
                    speedMode === "deep"
                      ? "bg-[#238636] text-white"
                      : "text-[#8b949e] hover:text-white"
                  }`}
                  title="1-10 commits/day (better contrast over existing commits)"
                >
                  Deep (1-10/day)
                </button>
              </div>
            </div>
          </div>

          {/* Option 1 vs Option 2 Method Switcher */}
          <div className="flex bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
            <button
              onClick={() => setActiveTab("cloud")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "cloud"
                  ? "bg-[#21262d] text-white border border-[#30363d] shadow-sm"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4 text-[#39d353]" />
              <span>1-Click Cloud Paint</span>
            </button>
            <button
              onClick={() => setActiveTab("cli")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "cli"
                  ? "bg-[#21262d] text-white border border-[#30363d] shadow-sm"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              <Terminal className="w-4 h-4 text-[#58a6ff]" />
              <span>1-Line Command (No Login)</span>
            </button>
          </div>

          {/* OPTION 1: 1-CLICK CLOUD PAINT */}
          {activeTab === "cloud" && (
            <div className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d] space-y-4">
              {auth.loading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-[#8b949e]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking GitHub connection...</span>
                </div>
              ) : !auth.configured ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                    <div className="space-y-1 text-[11px]">
                      <p className="font-semibold text-white">
                        GitHub OAuth App Not Configured Yet
                      </p>
                      <p className="leading-relaxed text-[#8b949e]">
                        To enable 1-Click Cloud Paint, add{" "}
                        <code className="text-white">GITHUB_CLIENT_ID</code> and{" "}
                        <code className="text-white">GITHUB_CLIENT_SECRET</code> to{" "}
                        {origin.includes("localhost")
                          ? "your local .env.local file"
                          : "your Vercel Environment Variables"}{" "}
                        (callback URL:{" "}
                        <code className="text-[#58a6ff]">{origin}/api/auth/callback</code>).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("cli")}
                    className="w-full py-2.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white font-semibold transition-all"
                  >
                    Use 1-Line Command (Works Immediately Without Setup) →
                  </button>
                </div>
              ) : !auth.authenticated ? (
                <div className="text-center py-3 space-y-3">
                  <p className="text-xs text-[#8b949e]">
                    Sign in once with GitHub and Graphiti will automatically create{" "}
                    <strong className="text-white">{safeRepo}</strong> (if needed) and push
                    all {totalCommits} commits in 1 second—no terminal required.
                  </p>
                  <button
                    onClick={handleSignInGitHub}
                    className="inline-flex items-center gap-2 bg-white hover:bg-gray-200 text-[#0d1117] px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95"
                  >
                    <Github className="w-4 h-4" />
                    <span>Sign in with GitHub</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Connected User Card */}
                  <div className="flex items-center justify-between bg-[#161b22] p-3 rounded-xl border border-[#30363d]">
                    <div className="flex items-center gap-3">
                      {auth.user?.avatar_url && (
                        <img
                          src={auth.user.avatar_url}
                          alt={auth.user.login}
                          className="w-8 h-8 rounded-full border border-[#30363d]"
                        />
                      )}
                      <div>
                        <p className="text-white font-semibold text-xs">
                          Connected as @{auth.user?.login}
                        </p>
                        <p className="text-[11px] text-[#8b949e] font-mono">
                          Commit email: {auth.user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href="https://github.com/settings/applications"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#8b949e] hover:text-[#f85149] px-2.5 py-1.5 rounded-lg hover:bg-[#f85149]/10 transition-all"
                        title="Revoke Graphiti OAuth access directly on GitHub"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </a>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-1 text-[11px] text-[#8b949e] hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-[#21262d] transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>

                  {deployError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149] text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{deployError}</span>
                    </div>
                  )}

                  {deployResult ? (
                    <div className="p-4 rounded-xl bg-[#238636]/15 border border-[#238636]/40 space-y-3">
                      <div className="flex items-center gap-2 text-[#39d353] font-bold text-sm">
                        <Check className="w-5 h-5" />
                        <span>
                          Painted {deployResult.totalCommits} commits ({deployResult.appended ? "Appended to existing repo" : "Created new repo"})!
                        </span>
                      </div>
                      <p className="text-xs text-[#8b949e]">
                        GitHub takes 1–3 minutes to refresh its profile cache.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={deployResult.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-2 rounded-lg font-semibold text-xs transition-all"
                        >
                          <span>View {targetYear} Profile Graph</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={deployResult.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-white px-4 py-2 rounded-lg font-semibold text-xs transition-all"
                        >
                          <span>Open Repo</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleCloudDeploy}
                      disabled={deploying || totalCommits === 0}
                      className="w-full flex items-center justify-center gap-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#238636]/30 active:scale-[0.99]"
                    >
                      {deploying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Pushing {totalCommits} commits to {safeRepo}...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Paint {totalCommits} Commits to @{auth.user?.login}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* OPTION 2: 1-LINE COMMAND */}
          {activeTab === "cli" && (
            <div className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d] space-y-4">
              {/* Step 1: Username + Empty Repo check */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#8b949e]">
                    Your GitHub Username
                  </label>
                  <input
                    type="text"
                    value={cliUsername}
                    onChange={(e) => setCliUsername(e.target.value)}
                    placeholder="e.g. cod-ak"
                    className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] text-white px-3 py-1.5 rounded-lg text-xs font-mono focus:outline-none"
                  />
                </div>
                <div className="flex bg-[#161b22] p-1 rounded-lg border border-[#30363d]">
                  <button
                    onClick={() => setPlatform("powershell")}
                    className={`flex-1 py-1.5 rounded text-[11px] font-medium transition-all ${
                      platform === "powershell"
                        ? "bg-[#21262d] text-white shadow-sm"
                        : "text-[#8b949e] hover:text-white"
                    }`}
                  >
                    Windows (PowerShell)
                  </button>
                  <button
                    onClick={() => setPlatform("bash")}
                    className={`flex-1 py-1.5 rounded text-[11px] font-medium transition-all ${
                      platform === "bash"
                        ? "bg-[#21262d] text-white shadow-sm"
                        : "text-[#8b949e] hover:text-white"
                    }`}
                  >
                    macOS / Linux
                  </button>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-[#8b949e]">
                <strong className="text-white">Prerequisite:</strong> Make sure an empty repository named{" "}
                <code className="text-white bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">
                  {safeRepo}
                </code>{" "}
                exists on your GitHub (skip if you already created it before).
              </p>

              {/* THE 1-LINER */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    Copy & Paste This Single Line into Your Terminal:
                  </span>
                  <button
                    onClick={handleCopyOneLiner}
                    className="flex items-center gap-1.5 bg-[#238636] hover:bg-[#2ea043] text-white px-3 py-1 rounded-lg font-semibold text-[11px] transition-all"
                  >
                    {copiedOneLiner ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Command</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-[#161b22] p-3 rounded-xl border border-[#30363d] font-mono text-[11px] text-[#39d353] break-all select-all">
                  {oneLiner}
                </div>
                <p className="text-[11px] text-[#8b949e]">
                  Runs in a clean temp folder, appends {totalCommits} commits to{" "}
                  <span className="text-white">{safeRepo}</span>, pushes automatically, and cleans up.
                </p>
              </div>

              {/* Fallback Manual Download */}
              <details className="pt-2 border-t border-[#30363d]/60">
                <summary className="flex items-center gap-1.5 text-[11px] text-[#8b949e] hover:text-white cursor-pointer select-none">
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Prefer to inspect or download the full script instead?</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCopyFull}
                      className="flex items-center gap-1 bg-[#21262d] hover:bg-[#30363d] text-white px-2.5 py-1 rounded-lg border border-[#30363d] text-[11px]"
                    >
                      {copiedFull ? <Check className="w-3 h-3 text-[#39d353]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFull ? "Copied" : "Copy Script"}</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1 bg-[#21262d] hover:bg-[#30363d] text-white px-2.5 py-1 rounded-lg border border-[#30363d] text-[11px]"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download File</span>
                    </button>
                  </div>
                  <pre className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] font-mono text-[10px] text-[#e6edf3] overflow-x-auto max-h-36 whitespace-pre">
                    {fullScript}
                  </pre>
                </div>
              </details>
            </div>
          )}

          {/* Safety Reassurance Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#238636]/10 border border-[#238636]/30 text-[#8b949e]">
            <ShieldCheck className="w-5 h-5 text-[#39d353] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-white font-medium text-xs">
                Append Mode & Easy Undo
              </p>
              <p className="text-[11px] leading-relaxed">
                All art commits live strictly inside{" "}
                <strong className="text-white">{safeRepo}</strong>. Your real coding projects stay untouched, and deleting that single repo erases all art anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#30363d] bg-[#161b22] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
