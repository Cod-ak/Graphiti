import crypto from "crypto";
import zlib from "zlib";

const EMPTY_TREE_SHA = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
const ZERO_SHA = "0000000000000000000000000000000000000000";

const OBJ_COMMIT = 1;
const OBJ_TREE = 2;

export interface CommitEntry {
  date: string; // YYYY-MM-DD
  count: number;
}

function sha1(buf: Buffer): string {
  return crypto.createHash("sha1").update(buf).digest("hex");
}

function encodePackObjectHeader(type: number, size: number): Buffer {
  const bytes: number[] = [];
  let first = ((type & 0x07) << 4) | (size & 0x0f);
  size >>= 4;
  if (size > 0) first |= 0x80;
  bytes.push(first);

  while (size > 0) {
    let b = size & 0x7f;
    size >>= 7;
    if (size > 0) b |= 0x80;
    bytes.push(b);
  }
  return Buffer.from(bytes);
}

export function buildGitPackfile(
  plan: CommitEntry[],
  authorName: string,
  authorEmail: string,
  parentSha: string | null
): { packfile: Buffer; headSha: string; totalCommits: number } {
  const objects: Array<{ type: number; data: Buffer }> = [];

  // Always include empty tree object (0 bytes)
  objects.push({ type: OBJ_TREE, data: Buffer.alloc(0) });

  let currentParent = parentSha && parentSha !== ZERO_SHA ? parentSha : null;
  let totalCommits = 0;

  // Sanitize name/email so no newlines or angle brackets break commit format
  const safeName = authorName.replace(/[<> \n\r]/g, " ").trim() || "Graphiti";
  const safeEmail = authorEmail.replace(/[<> \n\r]/g, "").trim() || "graphiti@users.noreply.github.com";

  for (const entry of plan) {
    const [y, m, d] = entry.date.split("-").map(Number);
    for (let i = 0; i < entry.count; i++) {
      const minuteOffset = i * 5;
      const hour = 12 + Math.floor(minuteOffset / 60);
      const minute = minuteOffset % 60;
      const unixSec = Math.floor(Date.UTC(y, m - 1, d, hour, minute, 0) / 1000);

      const lines = [`tree ${EMPTY_TREE_SHA}`];
      if (currentParent) {
        lines.push(`parent ${currentParent}`);
      }
      lines.push(`author ${safeName} <${safeEmail}> ${unixSec} +0000`);
      lines.push(`committer ${safeName} <${safeEmail}> ${unixSec} +0000`);
      lines.push("");
      lines.push(`Graphiti art: ${entry.date} #${i + 1}`);
      lines.push("");

      const body = Buffer.from(lines.join("\n"), "utf8");
      const fullObj = Buffer.concat([
        Buffer.from(`commit ${body.length}\0`, "utf8"),
        body,
      ]);
      currentParent = sha1(fullObj);
      objects.push({ type: OBJ_COMMIT, data: body });
      totalCommits++;
    }
  }

  if (!currentParent) {
    throw new Error("No commits generated in plan");
  }

  // Pack header: 'PACK' + version (2) + object count
  const header = Buffer.alloc(12);
  header.write("PACK", 0, 4, "ascii");
  header.writeUInt32BE(2, 4);
  header.writeUInt32BE(objects.length, 8);

  const chunks: Buffer[] = [header];
  for (const obj of objects) {
    chunks.push(encodePackObjectHeader(obj.type, obj.data.length));
    chunks.push(zlib.deflateSync(obj.data));
  }

  const packBody = Buffer.concat(chunks);
  const checksum = crypto.createHash("sha1").update(packBody).digest();
  const packfile = Buffer.concat([packBody, checksum]);

  return {
    packfile,
    headSha: currentParent,
    totalCommits,
  };
}

function pktLine(str: string): Buffer {
  const payload = Buffer.from(str, "utf8");
  const len = (payload.length + 4).toString(16).padStart(4, "0");
  return Buffer.concat([Buffer.from(len, "ascii"), payload]);
}

function parsePktLines(buf: Buffer): string[] {
  const lines: string[] = [];
  let offset = 0;
  while (offset + 4 <= buf.length) {
    const hexLen = buf.subarray(offset, offset + 4).toString("ascii");
    if (hexLen === "0000") {
      offset += 4;
      continue;
    }
    const len = parseInt(hexLen, 16);
    if (isNaN(len) || len < 4 || offset + len > buf.length) break;
    const payload = buf.subarray(offset + 4, offset + len).toString("utf8");
    lines.push(payload);
    offset += len;
  }
  return lines;
}

export async function pushArtCommitsToGitHub(params: {
  owner: string;
  repo: string;
  token: string;
  authorName: string;
  authorEmail: string;
  plan: CommitEntry[];
}): Promise<{ headSha: string; totalCommits: number; appended: boolean }> {
  const { owner, repo, token, authorName, authorEmail, plan } = params;
  const authHeader =
    "Basic " + Buffer.from(`x-access-token:${token}`).toString("base64");
  const baseUrl = `https://github.com/${owner}/${repo}.git`;

  // 1. Discover current ref on main (Append Mode)
  const refsRes = await fetch(
    `${baseUrl}/info/refs?service=git-receive-pack`,
    {
      headers: {
        Authorization: authHeader,
        "User-Agent": "git/2.40.0",
      },
    }
  );

  if (!refsRes.ok) {
    const errText = await refsRes.text();
    throw new Error(`Failed to inspect repository (${refsRes.status}): ${errText}`);
  }

  const refsBuf = Buffer.from(await refsRes.arrayBuffer());
  const refLines = parsePktLines(refsBuf);

  let oldSha = ZERO_SHA;
  for (const line of refLines) {
    if (line.startsWith("#")) continue;
    const clean = line.split("\0")[0].trim();
    const [sha, refName] = clean.split(/\s+/);
    if (refName === "refs/heads/main" && sha && sha !== ZERO_SHA) {
      oldSha = sha;
      break;
    }
  }

  // 2. Build Packfile (chaining onto oldSha if it exists!)
  const { packfile, headSha, totalCommits } = buildGitPackfile(
    plan,
    authorName,
    authorEmail,
    oldSha !== ZERO_SHA ? oldSha : null
  );

  // 3. Push Packfile via git-receive-pack
  const command = `${oldSha} ${headSha} refs/heads/main\0report-status\n`;
  const requestBody = Buffer.concat([
    pktLine(command),
    Buffer.from("0000", "ascii"),
    packfile,
  ]);

  const pushRes = await fetch(`${baseUrl}/git-receive-pack`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-git-receive-pack-request",
      Accept: "application/x-git-receive-pack-result",
      "User-Agent": "git/2.40.0",
    },
    body: requestBody,
  });

  if (!pushRes.ok) {
    const errText = await pushRes.text();
    throw new Error(`GitHub push failed (${pushRes.status}): ${errText}`);
  }

  const resultBuf = Buffer.from(await pushRes.arrayBuffer());
  const resultLines = parsePktLines(resultBuf).join(" | ");

  if (!resultLines.includes("unpack ok")) {
    throw new Error(`GitHub rejected packfile: ${resultLines}`);
  }
  if (resultLines.includes("ng refs/heads/main")) {
    throw new Error(`GitHub ref update rejected: ${resultLines}`);
  }

  return {
    headSha,
    totalCommits,
    appended: oldSha !== ZERO_SHA,
  };
}
