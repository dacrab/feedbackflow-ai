import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions", () => ({
  saveSettings: vi.fn().mockResolvedValue(undefined),
  updateSettingsModel: vi.fn().mockResolvedValue(undefined),
  deleteSettings: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { deleteSettings, saveSettings, updateSettingsModel } from "@/lib/actions";
import { LLMSettingsCard } from "./llm-settings-card";

// Call counts accumulate across tests otherwise, so `toHaveBeenCalledOnce`
// would only pass by accident of ordering.
beforeEach(() => {
  vi.clearAllMocks();
});

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

  it("shows active model in status row", () => {
    render(
      <LLMSettingsCard initialProvider="google" initialModel="gemini-2.5-flash" hasKey={true} />,
    );
    expect(screen.getByText(/google · gemini-2\.5-flash/)).toBeInTheDocument();
  });

  it("save button enables after typing key", async () => {
    const user = userEvent.setup();
    render(<LLMSettingsCard initialProvider={null} initialModel={null} hasKey={false} />);
    await user.type(screen.getByPlaceholderText(/paste openrouter api key/i), "sk-test");
    expect(screen.getByRole("button", { name: "save" })).toBeEnabled();
  });

  it("calls saveSettings with provider, model, and key", async () => {
    const user = userEvent.setup();
    render(<LLMSettingsCard initialProvider={null} initialModel={null} hasKey={false} />);
    await user.type(screen.getByPlaceholderText(/paste openrouter api key/i), "sk-test-key");
    await user.click(screen.getByRole("button", { name: "save" }));
    expect(saveSettings).toHaveBeenCalledWith("openrouter", "openrouter/auto", "sk-test-key");
  });

  it("shows update model button when configured", () => {
    render(<LLMSettingsCard initialProvider="openai" initialModel="gpt-5.4-nano" hasKey={true} />);
    expect(screen.getByRole("button", { name: "update model" })).toBeInTheDocument();
  });

  it("calls updateSettingsModel when updating model without changing key", async () => {
    const user = userEvent.setup();
    render(<LLMSettingsCard initialProvider="openai" initialModel="gpt-5.4-nano" hasKey={true} />);
    await user.click(screen.getByRole("button", { name: "update model" }));
    expect(updateSettingsModel).toHaveBeenCalledWith("gpt-5.4-nano");
  });

  it("shows remove button when configured", () => {
    render(<LLMSettingsCard initialProvider="openai" initialModel="gpt-5.4-nano" hasKey={true} />);
    expect(screen.getByRole("button", { name: "remove" })).toBeInTheDocument();
  });

  it("calls deleteSettings on remove", async () => {
    const user = userEvent.setup();
    render(<LLMSettingsCard initialProvider="openai" initialModel="gpt-5.4-nano" hasKey={true} />);
    await user.click(screen.getByRole("button", { name: "remove" }));
    expect(deleteSettings).toHaveBeenCalledOnce();
  });

  it("shows cancel button when editing key on configured provider", async () => {
    const user = userEvent.setup();
    render(<LLMSettingsCard initialProvider="openai" initialModel="gpt-5.4-nano" hasKey={true} />);
    await user.click(screen.getByText("••••••••••••••••"));
    expect(screen.getByRole("button", { name: "cancel" })).toBeInTheDocument();
  });
});
