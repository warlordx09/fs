"use client";

import { useFileExplorer } from "./FileExplorerContext";

export default function Sidebar() {
  const { setCurrentPath } = useFileExplorer();

  const folders = ["/Documents", "/Downloads", "/Pictures"]; // example, you can load dynamically

  return (
    <div className="w-48 bg-gray-50 border-r p-2">
      {folders.map((folder) => (
        <div
          key={folder}
          className="p-2 cursor-pointer hover:bg-gray-200 rounded"
          onClick={() => setCurrentPath(folder)}
        >
          {folder}
        </div>
      ))}
    </div>
  );
}
