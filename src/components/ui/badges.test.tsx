import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SentimentBadge, StatusBadge } from "./badges";

describe("SentimentBadge", () => {
  it("renders nothing for null", () => {
    const { container } = render(<SentimentBadge sentiment={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for undefined", () => {
    const { container } = render(<SentimentBadge sentiment={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ["positive", "text-green-500"],
    ["neutral", "text-muted-foreground"],
    ["negative", "text-red-500"],
  ] as const)("renders %s with class %s", (sentiment, expectedClass) => {
    render(<SentimentBadge sentiment={sentiment} />);
    const el = screen.getByText(sentiment);
    expect(el).toHaveClass("text-xs", expectedClass);
  });
});

describe("StatusBadge", () => {
  it("renders nothing for null", () => {
    const { container } = render(<StatusBadge status={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for undefined", () => {
    const { container } = render(<StatusBadge status={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for New", () => {
    const { container } = render(<StatusBadge status="New" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders [acknowledged] for Acknowledged", () => {
    render(<StatusBadge status="Acknowledged" />);
    const el = screen.getByText("[acknowledged]");
    expect(el).toHaveClass("text-xs", "text-blue-500");
  });

  it("renders [actioned] for Actioned", () => {
    render(<StatusBadge status="Actioned" />);
    const el = screen.getByText("[actioned]");
    expect(el).toHaveClass("text-xs", "text-purple-500");
  });
});
