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
    expect(screen.getByPlaceholderText("sk-...")).toBeInTheDocument();
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

  it("clicking edit model switches to edit-model mode", () => {
    render(<LLMSettingsCard initialProvider="openai" initialModel="gpt-4o" />);
    fireEvent.click(screen.getByRole("button", { name: "edit model" }));
    expect(screen.getByPlaceholderText("e.g. gpt-4o, gemini-2.5-pro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "cancel" })).toBeInTheDocument();
  });

  it("clicking update key switches to update-key mode", () => {
    render(<LLMSettingsCard initialProvider="openai" initialModel="gpt-4o" />);
    fireEvent.click(screen.getByRole("button", { name: "update key" }));
    expect(screen.getByPlaceholderText("sk-...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "cancel" })).toBeInTheDocument();
  });

  it("in add mode, save button is disabled when model or apiKey empty", () => {
    render(<LLMSettingsCard initialProvider={null} initialModel={null} />);
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
  });

  it("in add mode, filling fields and clicking save calls saveSettings", async () => {
    const user = userEvent.setup();
    render(<LLMSettingsCard initialProvider={null} initialModel={null} />);

    await user.type(screen.getByPlaceholderText("e.g. gpt-4o, gemini-2.5-pro"), "gpt-4o");
    await user.type(screen.getByPlaceholderText("sk-..."), "sk-test-key");
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(saveSettings).toHaveBeenCalledWith("google", "gpt-4o", "sk-test-key");
  });
});
