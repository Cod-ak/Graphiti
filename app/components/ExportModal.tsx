"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  Terminal,
  ShieldCheck,
  ExternalLink,
  Info,
} from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetYear: number;
  totalCommits: number;
  activeDays: number;
  powershellScript: string;
  bashScript: string;
  loading: boolean;
}

export default function ExportModal({
  isOpen,
  onClose,
  targetYear,
  totalCommits,
  activeDays,
  powershellScript,
  bashScript,
  loading,
}: ExportModalProps) {
  const [platform, setPlatform] = useState<"powershell" | "bash">("powershell");
  const [copied, setCopied] = useState(false);
  const [repoName, setRepoName] = useState("my-github-art");

  if (!isOpen) return null;

  const currentScript = platform === "powershell" ? powershellScript : bashScript;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = platform === "powershell" ? "run_art.ps1" : "run_art.sh";
    const blob = new Blob([currentScript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#238636]/20 border border-[#238636]/30 text-[#39d353]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Export & Run Script (Option B)
              </h2>
              <p className="text-xs text-[#8b949e]">
                Zero-OAuth, privacy-first backdated commit script for your machine
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
          {/* Summary Stats Pill */}
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

          {/* Step-by-Step Instructions */}
          <div className="space-y-3 bg-[#0d1117] p-4 rounded-xl border border-[#30363d]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#238636] text-[10px] text-white">
                1
              </span>
              Create an Empty Repo on GitHub
            </h3>
            <p className="text-xs leading-relaxed text-[#8b949e]">
              Go to GitHub and create a <strong>new public repository</strong> named{" "}
              <code className="text-white bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">
                {repoName}
              </code>
              . <em className="text-amber-400">Do not check "Add a README file"</em> (keep it completely empty).
            </p>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2 pt-2">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#238636] text-[10px] text-white">
                2
              </span>
              Run the Generator Script
            </h3>
            <p className="text-xs text-[#8b949e]">
              Open your terminal in an empty folder and run the script below:
            </p>

            {/* Platform Selector Tabs */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex bg-[#161b22] p-1 rounded-lg border border-[#30363d]">
                <button
                  onClick={() => setPlatform("powershell")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    platform === "powershell"
                      ? "bg-[#21262d] text-white shadow-sm"
                      : "text-[#8b949e] hover:text-white"
                  }`}
                >
                  Windows (PowerShell)
                </button>
                <button
                  onClick={() => setPlatform("bash")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    platform === "bash"
                      ? "bg-[#21262d] text-white shadow-sm"
                      : "text-[#8b949e] hover:text-white"
                  }`}
                >
                  macOS / Linux (Bash)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-white px-2.5 py-1 rounded-lg border border-[#30363d] transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#39d353]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-white px-2.5 py-1 rounded-lg border border-[#30363d] transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Script Box */}
            <div className="relative">
              <pre className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] font-mono text-[11px] text-[#e6edf3] overflow-x-auto max-h-40 whitespace-pre">
                {loading ? "Generating commit plan..." : currentScript}
              </pre>
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2 pt-2">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#238636] text-[10px] text-white">
                3
              </span>
              Push to GitHub
            </h3>
            <pre className="bg-[#161b22] p-2.5 rounded-lg border border-[#30363d] font-mono text-[11px] text-[#e6edf3] select-all">
{`git remote add origin https://github.com/<your-username>/${repoName}.git
git push -u origin main`}
            </pre>
          </div>

          {/* Safety Reassurance Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#238636]/10 border border-[#238636]/30 text-[#8b949e]">
            <ShieldCheck className="w-5 h-5 text-[#39d353] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-white font-medium text-xs">Zero Risk & Permanent Undo</p>
              <p className="text-[11px] leading-relaxed">
                The script creates empty commits that don't alter any files. Because all commits live in this isolated repository, you can completely erase the artwork and restore your graph anytime by simply deleting the{" "}
                <strong className="text-white">{repoName}</strong> repository on GitHub!
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
