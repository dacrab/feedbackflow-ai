import "server-only";

import crypto from "node:crypto";
import * as Sentry from "@sentry/nextjs";

/** HKDF `info`. A stored-key derivation parameter, not display text: changing it
 *  invalidates every provider key already encrypted in the database, so it is
 *  deliberately not derived from APP_NAME. */
const HKDF_INFO = "feedbackflow-aes-256-gcm";
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
  key = Buffer.from(crypto.hkdfSync("sha256", secret, "", HKDF_INFO, KEY_BYTES));
  return key;
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(GCM_IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${Buffer.concat([iv, tag, enc]).toString("base64")}`;
}

export function decrypt(payload: string): string {
  // Resolve the key first: a missing key is an operator problem, not bad data.
  const k = getKey();
  if (!payload.startsWith(`${VERSION}:`)) throw new Error("unsupported ciphertext version");
  const buf = Buffer.from(payload.slice(VERSION.length + 1), "base64");
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", k, buf.subarray(0, GCM_IV_BYTES));
    decipher.setAuthTag(buf.subarray(GCM_IV_BYTES, AUTH_TAG_END));
    return Buffer.concat([decipher.update(buf.subarray(AUTH_TAG_END)), decipher.final()]).toString(
      "utf8",
    );
  } catch (e) {
    throw new Error("decryption failed", { cause: e });
  }
}

// One undecryptable row must never abort a whole user's sync.
export function tryDecrypt(cipher: string | null, context: string): string | undefined {
  if (!cipher) return undefined;
  try {
    return decrypt(cipher);
  } catch (e) {
    Sentry.captureException(e, { extra: { context } });
    return undefined;
  }
}

// Hash first: fixed-length buffers, so no length leak and equal cost.
export function timingSafeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}
