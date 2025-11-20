"use client";

import { useState, MouseEvent, useEffect, useRef } from "react";
import { API } from "@/app/lib/api";
import { useFileExplorer } from "./FileExplorerContext";

export type FSNode = {
  name: string;
  type: "file" | "directory";
};

type FileGridProps = {
  items: FSNode[];
};

export default function FileGrid({ items }: FileGridProps) {
  const { currentPath, setCurrentPath, clipboard, setClipboard, selectedItem, setSelectedItem, reload } = useFileExplorer();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FSNode } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const openItem = (item: FSNode) => {
    setSelectedItem(item);
    if (item.type === "directory") setCurrentPath(`${currentPath}/${item.name}`);
    else alert("Open file: " + item.name);
  };

  const deleteItem = async (item: FSNode) => {
    await API.delete("/node", { path: `${currentPath}/${item.name}` });
    reload();
    setContextMenu(null);
    if (selectedItem?.name === item.name) setSelectedItem(null);
  };

const copyItem = (item: FSNode) => {
  setClipboard({
    item,
    action: "copy",
    fullPath: `${currentPath}/${item.name}` // store full path
  });
  setContextMenu(null);
};

const cutItem = (item: FSNode) => {
  setClipboard({
    item,
    action: "cut",
    fullPath: `${currentPath}/${item.name}` // store full path
  });
  setContextMenu(null);
};

const pasteItem = async () => {
  if (!clipboard) return;

  const destination = `${currentPath}/${clipboard.item.name}`;

  try {
    await API.post("/paste", {
      sourcePath: clipboard.fullPath, // use full path from clipboard
      destinationPath: destination,
      action: clipboard.action
    });
    setClipboard(null);
    reload();
    setContextMenu(null);
  } catch (err) {
    console.error("Failed to paste item:", err);
    alert("Error pasting item");
  }
};


  const handleRightClick = (e: MouseEvent, item: FSNode) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, item });
    setSelectedItem(item);
  };
useEffect(() => {
  const handleClickOutside = (e: globalThis.MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setContextMenu(null);
      setSelectedItem(null);
    }
  };

  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);


  return (
    <div className="relative" ref={containerRef}>
      <div className="p-4 grid grid-cols-6 gap-4 select-none">
        {items.map((item) => {
          const isSelected = selectedItem?.name === item.name;
          return (
            <div
              key={item.name}
              onDoubleClick={() => openItem(item)}
              onContextMenu={(e) => handleRightClick(e, item)}
              onClick={() => setSelectedItem(item)}
              className={`p-3 border rounded shadow cursor-pointer hover:shadow-md ${isSelected ? "bg-blue-100 border-blue-400" : "bg-white"}`}
            >
              <div className="text-4xl text-center">{item.type === "directory" ? "📁" : "📄"}</div>
              <div className="text-center text-sm mt-2">{item.name}</div>
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <div
          className="fixed bg-white border shadow p-2 z-50 min-w-[120px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className="block w-full text-left px-2 py-1 hover:bg-gray-200" onClick={() => copyItem(contextMenu.item)}>Copy</button>
          <button className="block w-full text-left px-2 py-1 hover:bg-gray-200" onClick={() => cutItem(contextMenu.item)}>Cut</button>
          <button className={`block w-full text-left px-2 py-1 hover:bg-gray-200 ${!clipboard ? "opacity-50 cursor-not-allowed" : ""}`} onClick={pasteItem} disabled={!clipboard}>Paste</button>
          <button className="block w-full text-left px-2 py-1 hover:bg-red-100 text-red-500" onClick={() => deleteItem(contextMenu.item)}>Delete</button>
        </div>
      )}
    </div>
  );
}
