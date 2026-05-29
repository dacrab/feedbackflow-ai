import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SentimentBadge, StatusBadge } from "./badges";

describe("SentimentBadge", () => {
  it.each([null, undefined])("renders nothing for %s", (v) => {
    const { container } = render(<SentimentBadge sentiment={v} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ["positive", "text-green-500"],
    ["neutral", "text-muted-foreground"],
    ["negative", "text-red-500"],
  ] as const)("renders %s with correct color class", (sentiment, cls) => {
    render(<SentimentBadge sentiment={sentiment} />);
    expect(screen.getByText(sentiment)).toHaveClass("text-xs", cls);
  });
});

describe("StatusBadge", () => {
  it.each([null, undefined, "New"] as const)("renders nothing for %s", (v) => {
    const { container } = render(<StatusBadge status={v} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ["Acknowledged", "[acknowledged]", "text-blue-500"],
    ["Actioned", "[actioned]", "text-purple-500"],
  ] as const)("renders %s correctly", (status, text, cls) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(text)).toHaveClass("text-xs", cls);
  });
});
