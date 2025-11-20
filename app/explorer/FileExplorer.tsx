"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import FileGrid from "./FileGrid";
import { API } from "@/app/lib/api";
import type { FSNode } from "./FileGrid";
import { FileExplorerContext, ClipboardItem } from "./FileExplorerContext";

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [items, setItems] = useState<FSNode[]>([]);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<FSNode | null>(null);

  const load = async () => {
    try {
      const res = await API.get(`/directory?path=${encodeURIComponent(currentPath)}`);
      setItems(res);
    } catch (err) {
      console.error("Failed to load directory:", err);
    }
  };

  useEffect(() => {
    load();
  }, [currentPath]);

  return (
    <FileExplorerContext.Provider
      value={{
        currentPath,
        setCurrentPath,
        clipboard,
        setClipboard,
        selectedItem,
        setSelectedItem,
        reload: load,
      }}
    >
      <div className="flex w-full h-full">
        {/* <Sidebar /> */}
        <div className="flex flex-col flex-1">
          <Topbar />
          <FileGrid items={items} />
        </div>
      </div>
    </FileExplorerContext.Provider>
  );
}
