import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual, useTransition: () => [false, (fn: () => void) => fn()] };
});

vi.mock("@/lib/actions", () => ({
  saveSettings: vi.fn().mockResolvedValue(undefined),
  updateSettingsModel: vi.fn().mockResolvedValue(undefined),
  updateSettingsKey: vi.fn().mockResolvedValue(undefined),
  deleteSettings: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { saveSettings } from "@/lib/actions";
import { LLMSettingsCard } from "./llm-settings-card";

afterEach(cleanup);

describe("LLMSettingsCard", () => {
  it("renders in add mode when no initialProvider/initialModel", () => {
    render(<LLMSettingsCard initialProvider={null} initialModel={null} />);
    expect(screen.getByText("provider")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("paste your api key...")).toBeInTheDocument();
  });

  it("renders in view mode when initialProvider and initialModel provided", () => {
    render(<LLMSettingsCard initialProvider="openai" initialModel="gpt-4o" />);
    expect(screen.getByText("● connected")).toBeInTheDocument();
    expect(screen.getByText("gpt-4o")).toBeInTheDocument();
  });

  it("view mode shows provider name and model", () => {
    render(<LLMSettingsCard initialProvider="google" initialModel="gemini-2.5-pro" />);
    expect(screen.getByText("google")).toBeInTheDocument();
    expect(screen.getByText("gemini-2.5-pro")).toBeInTheDocument();
  });

  it("clicking change model switches to edit-model mode", () => {
    render(<LLMSettingsCard initialProvider="openai" initialModel="gpt-4o" />);
    fireEvent.click(screen.getByRole("button", { name: "change model" }));
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "cancel" })).toBeInTheDocument();
  });

  it("clicking update key switches to update-key mode", () => {
    render(<LLMSettingsCard initialProvider="openai" initialModel="gpt-4o" />);
    fireEvent.click(screen.getByRole("button", { name: "update key" }));
    expect(screen.getByPlaceholderText("paste your api key...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "cancel" })).toBeInTheDocument();
  });

  it("in add mode, save button is disabled when apiKey empty", () => {
    render(<LLMSettingsCard initialProvider={null} initialModel={null} />);
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
  });

  it("in add mode, filling api key and clicking save calls saveSettings with default model", async () => {
    const user = userEvent.setup();
    render(<LLMSettingsCard initialProvider={null} initialModel={null} />);

    await user.type(screen.getByPlaceholderText("paste your api key..."), "sk-test-key");
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(saveSettings).toHaveBeenCalledWith("google", "gemini-2.5-flash", btoa("sk-test-key"));
  });
});
