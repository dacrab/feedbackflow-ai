// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isPrivateHost } from "./guard";

const PRIVATE = [
  "localhost",
  "app.localhost",
  "svc.internal",
  "::1",
  "[::1]",
  "0.0.0.0",
  "fd00::1",
  "fd12:3456::1",
  "10.0.0.1",
  "10.255.255.254",
  "172.16.0.1",
  "172.31.255.254",
  "192.168.1.1",
  "169.254.169.254", // cloud metadata
  "127.0.0.1",
  "0.1.2.3",
];

const PUBLIC = [
  "hooks.slack.com",
  "example.com",
  "8.8.8.8",
  "172.15.0.1", // just below the RFC1918 block
  "172.32.0.1", // just above it
  "11.0.0.1", // looks like 10.x at a glance but is not
  "192.169.1.1",
  "169.253.1.1",
];

describe("isPrivateHost", () => {
  it.each(PRIVATE)("rejects %s", (host) => {
    expect(isPrivateHost(host)).toBe(true);
  });

  it.each(PUBLIC)("allows %s", (host) => {
    expect(isPrivateHost(host)).toBe(false);
  });
});
