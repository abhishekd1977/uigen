import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  ToolInvocationDisplay,
  getToolDescription,
} from "../ToolInvocationDisplay";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

test("shows 'Creating' label for str_replace_editor create command", () => {
  const invocation = {
    state: "call",
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
  } as ToolInvocation;

  render(<ToolInvocationDisplay toolInvocation={invocation} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows 'Editing' label for str_replace_editor str_replace command", () => {
  const invocation = {
    state: "call",
    toolCallId: "2",
    toolName: "str_replace_editor",
    args: {
      command: "str_replace",
      path: "/components/Button.jsx",
      old_str: "foo",
      new_str: "bar",
    },
  } as ToolInvocation;

  render(<ToolInvocationDisplay toolInvocation={invocation} />);
  expect(screen.getByText("Editing Button.jsx")).toBeDefined();
});

test("shows 'Editing' label for str_replace_editor insert command", () => {
  const invocation = {
    state: "call",
    toolCallId: "3",
    toolName: "str_replace_editor",
    args: { command: "insert", path: "/utils/helpers.ts", insert_line: 5 },
  } as ToolInvocation;

  render(<ToolInvocationDisplay toolInvocation={invocation} />);
  expect(screen.getByText("Editing helpers.ts")).toBeDefined();
});

test("shows 'Reading' label for str_replace_editor view command", () => {
  const invocation = {
    state: "call",
    toolCallId: "4",
    toolName: "str_replace_editor",
    args: { command: "view", path: "/App.jsx" },
  } as ToolInvocation;

  render(<ToolInvocationDisplay toolInvocation={invocation} />);
  expect(screen.getByText("Reading App.jsx")).toBeDefined();
});

test("shows 'Renaming' label for file_manager rename command", () => {
  const invocation = {
    state: "call",
    toolCallId: "5",
    toolName: "file_manager",
    args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
  } as ToolInvocation;

  render(<ToolInvocationDisplay toolInvocation={invocation} />);
  expect(screen.getByText("Renaming old.jsx")).toBeDefined();
});

test("shows 'Deleting' label for file_manager delete command", () => {
  const invocation = {
    state: "call",
    toolCallId: "6",
    toolName: "file_manager",
    args: { command: "delete", path: "/unused.jsx" },
  } as ToolInvocation;

  render(<ToolInvocationDisplay toolInvocation={invocation} />);
  expect(screen.getByText("Deleting unused.jsx")).toBeDefined();
});

test("shows spinner when tool is in progress", () => {
  const invocation = {
    state: "call",
    toolCallId: "7",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
  } as ToolInvocation;

  const { container } = render(
    <ToolInvocationDisplay toolInvocation={invocation} />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
});

test("shows green dot when tool is complete", () => {
  const invocation = {
    state: "result",
    toolCallId: "8",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    result: "File created successfully",
  } as ToolInvocation;

  const { container } = render(
    <ToolInvocationDisplay toolInvocation={invocation} />
  );
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("falls back to toolName for unknown tools", () => {
  const invocation = {
    state: "call",
    toolCallId: "9",
    toolName: "unknown_tool",
    args: {},
  } as ToolInvocation;

  render(<ToolInvocationDisplay toolInvocation={invocation} />);
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("getToolDescription handles missing path gracefully", () => {
  const invocation = {
    state: "call",
    toolCallId: "10",
    toolName: "str_replace_editor",
    args: { command: "create" },
  } as ToolInvocation;

  const { label } = getToolDescription(invocation);
  expect(label).toBe("Creating file");
});

test("getToolDescription handles deeply nested paths", () => {
  const invocation = {
    state: "call",
    toolCallId: "11",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/components/ui/Button.tsx" },
  } as ToolInvocation;

  const { label } = getToolDescription(invocation);
  expect(label).toBe("Creating Button.tsx");
});