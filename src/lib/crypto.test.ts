import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env["ENCRYPTION_KEY"] =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

const { encrypt, decrypt, timingSafeEqual } = await import("./crypto");

describe("encrypt/decrypt", () => {
  it("roundtrip preserves plaintext", () => {
    const plain = "hello world! 🎉";
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it("produces unique ciphertext each call (random IV)", () => {
    const plain = "same input";
    expect(encrypt(plain)).not.toBe(encrypt(plain));
  });

  it("decrypt with invalid data throws", () => {
    expect(() => decrypt("not-valid-base64!!!")).toThrow();
    expect(() => decrypt(Buffer.from("too-short").toString("base64"))).toThrow();
  });

  it("decrypt with tampered ciphertext throws", () => {
    const cipher = encrypt("secret");
    const buf = Buffer.from(cipher, "base64");
    buf[buf.length - 1] ^= 0xff; // flip last byte
    expect(() => decrypt(buf.toString("base64"))).toThrow();
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
