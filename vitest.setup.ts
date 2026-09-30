import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// RTL only auto-cleans when Vitest globals are enabled, which they are not, so
// without this every rendered tree leaks into the next test.
afterEach(() => {
  if (typeof document !== "undefined") cleanup();
});
