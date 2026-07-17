import crypto from "node:crypto";

const SALT = "feedbackflow-aes-256-gcm";

let key: Buffer | null = null;

function getKey(): Buffer {
  if (key) return key;
  const secret = process.env["ENCRYPTION_KEY"];
  if (!secret) throw new Error("ENCRYPTION_KEY is required");
  key = Buffer.from(crypto.hkdfSync("sha256", secret, "", SALT, 32));
  return key;
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(b64: string): string {
  try {
    const buf = Buffer.from(b64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
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
