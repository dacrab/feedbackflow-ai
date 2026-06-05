import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button, Card, Input, Select } from "./ui";

afterEach(cleanup);

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
