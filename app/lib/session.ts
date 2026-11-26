import crypto from "crypto";
import { cookies } from "next/headers";

export interface GitHubSession {
  token: string;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

const COOKIE_NAME = "graphiti_gh_session";

function getSecretKey(): Buffer {
  const raw =
    process.env.SESSION_SECRET || process.env.GITHUB_CLIENT_SECRET;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing SESSION_SECRET or GITHUB_CLIENT_SECRET in production");
    }
    return crypto
      .createHash("sha256")
      .update("graphiti-local-dev-only-secret")
      .digest();
  }
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSession(session: GitHubSession): string {
  const key = getSecretKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = JSON.stringify(session);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptSession(tokenStr: string): GitHubSession | null {
  try {
    const key = getSecretKey();
    const raw = Buffer.from(tokenStr, "base64url");
    if (raw.length < 28) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
    return JSON.parse(decrypted) as GitHubSession;
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<GitHubSession | null> {
  const cookieStore = await cookies();
  const val = cookieStore.get(COOKIE_NAME)?.value;
  if (!val) return null;
  return decryptSession(val);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
