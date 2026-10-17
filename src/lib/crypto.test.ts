// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env["ENCRYPTION_KEY"] =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

const { encrypt, decrypt, timingSafeEqual } = await import("./crypto");

describe("encrypt/decrypt", () => {
  it("roundtrip preserves plaintext", () => {
    expect(decrypt(encrypt("hello world! 🎉"))).toBe("hello world! 🎉");
  });

  it("roundtrip preserves empty string", () => {
    expect(decrypt(encrypt(""))).toBe("");
  });

  it("produces unique ciphertext each call (random IV)", () => {
    expect(encrypt("same input")).not.toBe(encrypt("same input"));
  });

  it("decrypt with invalid data throws", () => {
    // Fails the version gate before any base64 decoding.
    expect(() => decrypt("not-versioned")).toThrow("unsupported ciphertext version");
    // Reaches the real data path: Buffer.from silently drops the invalid
    // characters, leaving a GCM IV that is too short.
    expect(() => decrypt("v1:not-valid-base64!!!")).toThrow("decryption failed");
    expect(() => decrypt(`v1:${Buffer.from("too-short").toString("base64")}`)).toThrow(
      "decryption failed",
    );
  });

  it("decrypt with tampered ciphertext throws", () => {
    const cipher = encrypt("secret");
    const buf = Buffer.from(cipher.replace(/^v1:/, ""), "base64");
    buf.writeUInt8(buf.readUInt8(buf.length - 1) ^ 0xff, buf.length - 1);
    expect(() => decrypt(`v1:${buf.toString("base64")}`)).toThrow();
  });
});

describe("timingSafeEqual", () => {
  it("returns true for equal strings", () => expect(timingSafeEqual("abc", "abc")).toBe(true));
  it("returns false for different strings", () =>
    expect(timingSafeEqual("abc", "abd")).toBe(false));
  it("returns false for different lengths", () =>
    expect(timingSafeEqual("abc", "abcd")).toBe(false));
  it("returns false for empty vs non-empty", () => expect(timingSafeEqual("", "a")).toBe(false));
});
