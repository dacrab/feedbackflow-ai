import crypto from "node:crypto";

const SALT = "feedbackflow-aes-256-gcm";
const VERSION = "v1";
const KEY_BYTES = 32;
const GCM_IV_BYTES = 12;
const GCM_TAG_BYTES = 16;
const AUTH_TAG_END = GCM_IV_BYTES + GCM_TAG_BYTES;

let key: Buffer | null = null;

function getKey(): Buffer {
  if (key) return key;
  const secret = process.env["ENCRYPTION_KEY"];
  if (!secret) throw new Error("ENCRYPTION_KEY is required");
  key = Buffer.from(crypto.hkdfSync("sha256", secret, "", SALT, KEY_BYTES));
  return key;
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(GCM_IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${Buffer.concat([iv, tag, enc]).toString("base64")}`;
}

export function decrypt(b64: string): string {
  try {
    const payload = b64.startsWith(`${VERSION}:`) ? b64.slice(VERSION.length + 1) : b64;
    const buf = Buffer.from(payload, "base64");
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getKey(),
      buf.subarray(0, GCM_IV_BYTES),
    );
    decipher.setAuthTag(buf.subarray(GCM_IV_BYTES, AUTH_TAG_END));
    return Buffer.concat([decipher.update(buf.subarray(AUTH_TAG_END)), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    throw new Error("decryption failed");
  }
}

const DUMMY = Buffer.alloc(64);

export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(DUMMY, DUMMY);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
