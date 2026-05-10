import crypto from "node:crypto";

const secret = process.env["ENCRYPTION_KEY"];
if (!secret) throw new Error("ENCRYPTION_KEY is required");

// HKDF derives a proper key from the high-entropy env secret with domain separation.
const KEY = Buffer.from(crypto.hkdfSync("sha256", secret, "", "feedbackflow-aes-256-gcm", 32));

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(b64: string): string {
  try {
    const buf = Buffer.from(b64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("decryption failed");
  }
}

// Fixed: always run the comparison regardless of length to prevent timing side-channels.
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
