import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual, useTransition: () => [false, (fn: () => void) => fn()] };
});

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
    expect(screen.getByText("provider")).toBeInTheDocument();
    expect(screen.getByText("model")).toBeInTheDocument();
  });

  it("save button disabled when no api key entered", () => {
    render(<LLMSettingsCard initialProvider={null} initialModel={null} hasKey={false} />);
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
  });

  it("shows key saved indicator when configured with key", () => {
    render(<LLMSettingsCard initialProvider="openai" initialModel="gpt-5.4-nano" hasKey={true} />);
    expect(screen.getByText("● key saved")).toBeInTheDocument();
  });

  it("shows current config status row when configured", () => {
    render(
      <LLMSettingsCard initialProvider="google" initialModel="gemini-2.5-flash" hasKey={true} />,
    );
    expect(screen.getAllByText(/gemini-2\.5-flash/).length).toBeGreaterThan(0);
  });

  it("save button enabled after typing api key", async () => {
    const user = userEvent.setup();
    render(<LLMSettingsCard initialProvider={null} initialModel={null} hasKey={false} />);
    await user.type(screen.getByPlaceholderText(/paste openrouter api key/i), "sk-test-key");
    expect(screen.getByRole("button", { name: "save" })).toBeEnabled();
  });

  it("calls saveSettings with correct args on save", async () => {
    const user = userEvent.setup();
    render(<LLMSettingsCard initialProvider={null} initialModel={null} hasKey={false} />);
    await user.type(screen.getByPlaceholderText(/paste openrouter api key/i), "sk-test-key");
    await user.click(screen.getByRole("button", { name: "save" }));
    expect(saveSettings).toHaveBeenCalledWith("openrouter", "openrouter/auto", btoa("sk-test-key"));
  });
});
