"use client";

import { Loader2, FilePlus, FileEdit, Eye, FileX, FolderInput } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolInvocationDisplayProps {
  toolInvocation: ToolInvocation;
}

function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

export function getToolDescription(toolInvocation: ToolInvocation): {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
} {
  const { toolName, args } = toolInvocation;
  const path = args?.path as string | undefined;
  const fileName = path ? getFileName(path) : "file";

  if (toolName === "str_replace_editor") {
    const command = args?.command as string | undefined;
    switch (command) {
      case "create":
        return { label: `Creating ${fileName}`, icon: FilePlus };
      case "str_replace":
        return { label: `Editing ${fileName}`, icon: FileEdit };
      case "insert":
        return { label: `Editing ${fileName}`, icon: FileEdit };
      case "view":
        return { label: `Reading ${fileName}`, icon: Eye };
      default:
        return { label: `Modifying ${fileName}`, icon: FileEdit };
    }
  }

  if (toolName === "file_manager") {
    const command = args?.command as string | undefined;
    switch (command) {
      case "rename":
        return { label: `Renaming ${fileName}`, icon: FolderInput };
      case "delete":
        return { label: `Deleting ${fileName}`, icon: FileX };
      default:
        return { label: `Managing ${fileName}`, icon: FileEdit };
    }
  }

  return { label: toolName, icon: FileEdit };
}

export function ToolInvocationDisplay({ toolInvocation }: ToolInvocationDisplayProps) {
  const isComplete = toolInvocation.state === "result" && toolInvocation.result;
  const { label, icon: Icon } = getToolDescription(toolInvocation);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <Icon className="w-3 h-3 text-neutral-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <Icon className="w-3 h-3 text-neutral-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}