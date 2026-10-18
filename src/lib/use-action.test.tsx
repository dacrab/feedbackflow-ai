import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmDelete, useAction } from "./use-action";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("confirmDelete", () => {
  it("runs the action only when the user confirms", () => {
    const action = vi.fn();
    const confirm = vi.fn().mockReturnValue(true);
    vi.stubGlobal("confirm", confirm);

    confirmDelete("delete this?", action);
    expect(confirm).toHaveBeenCalledWith("delete this?");
    expect(action).toHaveBeenCalledOnce();

    confirm.mockReturnValue(false);
    confirmDelete("delete this?", action);
    expect(action).toHaveBeenCalledOnce();
  });
});

describe("useAction", () => {
  it("resolves true and toasts on success", async () => {
    const { result } = renderHook(() => useAction());
    let ok = false;
    await act(async () => {
      ok = await result.current.run(async () => "done", "saved");
    });

    expect(ok).toBe(true);
    expect(toast.success).toHaveBeenCalledWith("saved");
  });

  it("resolves false and reports the failure", async () => {
    const { result } = renderHook(() => useAction());
    let ok = true;
    await act(async () => {
      ok = await result.current.run(
        async () => {
          throw new Error("nope");
        },
        undefined,
        "fallback",
      );
    });

    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("nope");
  });
});
