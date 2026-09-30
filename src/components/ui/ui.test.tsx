import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, Card, Input, MetricCard, Select, SentimentBadge, StatusBadge } from "./ui";

describe("MetricCard", () => {
  it("renders label prefixed with // and the value", () => {
    render(<MetricCard label="total" value={42} />);
    expect(screen.getByText("// total")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders a positive delta with an up arrow", () => {
    render(<MetricCard label="x" value="1" delta={12} />);
    expect(screen.getByText("↑12")).toBeInTheDocument();
  });

  it("renders a negative delta as its absolute value with a down arrow", () => {
    render(<MetricCard label="x" value="1" delta={-7} />);
    expect(screen.getByText("↓7")).toBeInTheDocument();
  });

  it("treats a zero delta as non-negative (up arrow)", () => {
    render(<MetricCard label="x" value="1" delta={0} />);
    expect(screen.getByText("↑0")).toBeInTheDocument();
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

  it("renders the sentiment text", () => {
    render(<SentimentBadge sentiment="positive" />);
    expect(screen.getByText("positive")).toBeInTheDocument();
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

  it("renders a bracketed lowercase label for acknowledged", () => {
    render(<StatusBadge status="Acknowledged" />);
    expect(screen.getByText("[acknowledged]")).toBeInTheDocument();
  });

  it("renders a bracketed lowercase label for actioned", () => {
    render(<StatusBadge status="Actioned" />);
    expect(screen.getByText("[actioned]")).toBeInTheDocument();
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
  it("applies the sm size by default", () => {
    render(<Input placeholder="default" />);
    expect(screen.getByPlaceholderText("default")).toHaveClass("h-8", "px-2");
  });

  it("accepts an explicit size", () => {
    render(<Input size="xs" placeholder="small" />);
    expect(screen.getByPlaceholderText("small")).toHaveClass("h-7");
  });
});

describe("Button", () => {
  it("defaults to type=button so it cannot submit a form by accident", () => {
    render(<Button>click me</Button>);
    expect(screen.getByRole("button", { name: "click me" })).toHaveAttribute("type", "button");
  });

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

  it("shows fallback text when isLoading without loadingText", () => {
    render(<Button isLoading>click me</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("...");
  });

  it("is disabled when disabled prop set", () => {
    render(<Button disabled>click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
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
