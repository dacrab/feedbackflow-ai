import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button, Card, Input, MetricCard, Select, SentimentBadge, StatusBadge } from "./ui";

afterEach(cleanup);

describe("MetricCard", () => {
  it("renders label prefixed with // and the value", () => {
    render(<MetricCard label="total" value={42} />);
    expect(screen.getByText("// total")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders a positive delta with an up arrow and green class", () => {
    render(<MetricCard label="x" value="1" delta={12} />);
    const delta = screen.getByText("↑12");
    expect(delta).toHaveClass("text-green-500");
  });

  it("renders a negative delta as its absolute value with a down arrow and red class", () => {
    render(<MetricCard label="x" value="1" delta={-7} />);
    const delta = screen.getByText("↓7");
    expect(delta).toHaveClass("text-red-500");
  });

  it("treats a zero delta as non-negative (up arrow, green)", () => {
    render(<MetricCard label="x" value="1" delta={0} />);
    expect(screen.getByText("↑0")).toHaveClass("text-green-500");
  });

  it("omits the delta indicator when delta is undefined", () => {
    render(<MetricCard label="x" value="1" />);
    expect(screen.queryByText(/[↑↓]/)).not.toBeInTheDocument();
  });

  it("renders the note when provided", () => {
    render(<MetricCard label="x" value="1" note="last 24h" />);
    expect(screen.getByText("last 24h")).toBeInTheDocument();
  });
});

describe("SentimentBadge", () => {
  it("renders nothing when sentiment is missing", () => {
    const { container } = render(<SentimentBadge sentiment={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the sentiment text with its color class", () => {
    render(<SentimentBadge sentiment="positive" />);
    expect(screen.getByText("positive")).toHaveClass("text-green-500");
  });
});

describe("StatusBadge", () => {
  it("renders nothing for the default New status", () => {
    const { container } = render(<StatusBadge status="New" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when status is missing", () => {
    const { container } = render(<StatusBadge status={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a bracketed lowercase label with color for non-default statuses", () => {
    render(<StatusBadge status="Acknowledged" />);
    expect(screen.getByText("[acknowledged]")).toHaveClass("text-blue-500");
  });
});

describe("Card", () => {
  it("renders title and children", () => {
    render(
      <Card title="test title">
        <p>child content</p>
      </Card>,
    );
    expect(screen.getByText("// test title")).toBeInTheDocument();
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("applies className", () => {
    render(
      <Card title="x" className="custom-class">
        <p>c</p>
      </Card>,
    );
    expect(screen.getByText("// x").parentElement).toHaveClass("custom-class");
  });
});

describe("Input", () => {
  it("renders with default variant", () => {
    render(<Input placeholder="default" />);
    expect(screen.getByPlaceholderText("default")).toHaveClass("h-10", "px-3");
  });

  it("renders with sm variant", () => {
    render(<Input variant="sm" placeholder="small" />);
    expect(screen.getByPlaceholderText("small")).toHaveClass("h-8", "px-2");
  });
});

describe("Button", () => {
  it("renders children", () => {
    render(<Button>click me</Button>);
    expect(screen.getByRole("button", { name: "click me" })).toBeInTheDocument();
  });

  it("shows loading text when isLoading", () => {
    render(
      <Button isLoading loadingText="loading...">
        click me
      </Button>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveTextContent("loading...");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });

  it("shows spinner when isLoading without loadingText", () => {
    render(<Button isLoading>click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button").querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("is disabled when disabled prop set", () => {
    render(<Button disabled>click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies primary variant class", () => {
    render(<Button variant="primary">primary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-foreground", "text-background");
  });

  it("applies sm size class", () => {
    render(<Button size="sm">small</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-8", "px-3");
  });
});

describe("Select", () => {
  it("renders children options", () => {
    render(
      <Select>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </Select>,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
  });
});
