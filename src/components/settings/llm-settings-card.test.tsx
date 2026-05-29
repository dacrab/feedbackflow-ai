import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/use-action", () => ({
  useAction: () => ({
    act: (fn: () => Promise<void>, msg?: string) => {
      fn().then(() => msg && vi.fn()(msg));
    },
    pending: false,
  }),
}));

vi.mock("@/lib/actions", () => ({
  saveSettings: vi.fn().mockResolvedValue(undefined),
  updateSettingsModel: vi.fn().mockResolvedValue(undefined),
  deleteSettings: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { saveSettings } from "@/lib/actions";
import { LLMSettingsCard } from "./llm-settings-card";

afterEach(cleanup);

describe("LLMSettingsCard", () => {
  it("renders provider and model selects", () => {
    render(<LLMSettingsCard initialProvider={null} initialModel={null} hasKey={false} />);
    expect(screen.getByLabelText("provider")).toBeInTheDocument();
    expect(screen.getByLabelText("model")).toBeInTheDocument();
  });

  it("save button disabled with no api key", () => {
    render(<LLMSettingsCard initialProvider={null} initialModel={null} hasKey={false} />);
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
  });

  it("shows key saved indicator when configured", () => {
    render(<LLMSettingsCard initialProvider="openai" initialModel="gpt-5.4-nano" hasKey={true} />);
    expect(screen.getByText("● key saved")).toBeInTheDocument();
  });

  it("shows active config in status row", () => {
    render(<LLMSettingsCard initialProvider="google" initialModel="gemini-2.5-flash" hasKey={true} />);
    expect(screen.getAllByText(/gemini-2\.5-flash/).length).toBeGreaterThan(0);
  });

  it("save button enables after typing key", async () => {
    const user = userEvent.setup();
    render(<LLMSettingsCard initialProvider={null} initialModel={null} hasKey={false} />);
    await user.type(screen.getByPlaceholderText(/paste openrouter api key/i), "sk-test");
    expect(screen.getByRole("button", { name: "save" })).toBeEnabled();
  });

  it("calls saveSettings with provider, model, and base64 key", async () => {
    const user = userEvent.setup();
    render(<LLMSettingsCard initialProvider={null} initialModel={null} hasKey={false} />);
    await user.type(screen.getByPlaceholderText(/paste openrouter api key/i), "sk-test-key");
    await user.click(screen.getByRole("button", { name: "save" }));
    expect(saveSettings).toHaveBeenCalledWith("openrouter", "openrouter/auto", btoa("sk-test-key"));
  });
});
