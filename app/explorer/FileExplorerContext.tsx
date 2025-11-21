"use client";

import { createContext, useContext } from "react";
import type { FSNode } from "./FileGrid";

export type ClipboardItem = {
  item: FSNode;
  action: "copy" | "cut";
  fullPath: string;
};

export type FileExplorerContextType = {
  currentPath: string;
  setCurrentPath: (path: string) => void;

  clipboard: ClipboardItem | null;
  setClipboard: (c: ClipboardItem | null) => void;

  selectedItem: FSNode | null;
  setSelectedItem: (s: FSNode | null) => void;

  reload: () => Promise<void>;

  // ===== EDITOR STATE =====
  editorOpen: boolean;
  setEditorOpen: (open: boolean) => void;

  editorContent: string;
  setEditorContent: (content: string) => void;

  editorPath: string;
  setEditorPath: (path: string) => void;
};

export const FileExplorerContext =
  createContext<FileExplorerContextType | undefined>(undefined);

export const useFileExplorer = () => {
  const context = useContext(FileExplorerContext);
  if (!context) {
    throw new Error("useFileExplorer must be used within FileExplorerProvider");
  }
  return context;
};
