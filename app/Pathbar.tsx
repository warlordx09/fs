"use client";

import { ChevronRight, ChevronUp } from "lucide-react";

interface PathBarProps {
  currentPath: string;             // e.g. "/" or "/folder/subfolder"
  setCurrentPath: (path: string) => void;
}

export default function PathBar({ currentPath, setCurrentPath }: PathBarProps) {
  // Normalize path, ensure it always starts with "/"
  const norm = currentPath.startsWith("/") ? currentPath : "/" + currentPath;
  const parts = norm.split("/").filter(Boolean); // ["folder", "subfolder"]

  // When user clicks "Up"
  const goUp = () => {
    if (parts.length === 0) {
      // Already at root
      setCurrentPath("/");
    } else {
      const newPath = "/" + parts.slice(0, parts.length - 1).join("/");
      setCurrentPath(newPath === "" ? "/" : newPath);
    }
  };

  // Navigate to any path part
  const goTo = (index: number) => {
    const newPath = "/" + parts.slice(0, index + 1).join("/");
    setCurrentPath(newPath);
  };

  return (
    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 border-b">
      {/* Up Button */}
      <button
        onClick={goUp}
        disabled={parts.length === 0}
        className="px-2 py-1 rounded-md border bg-white hover:bg-gray-50 disabled:opacity-40"
      >
        <ChevronUp size={16} />
      </button>

      {/* Breadcrumb / Path */}
      <div className="flex items-center gap-1 text-sm bg-white px-3 py-1 rounded-md border overflow-x-auto whitespace-nowrap">
        {/* Root segment */}
        <span
          className="cursor-pointer hover:text-blue-600 font-medium"
          onClick={() => setCurrentPath("/")}
        >
          {parts.length === 0 ? "/" : "This PC"}
        </span>

        {/* Other segments */}
        {parts.map((part, i) => (
          <div key={i} className="flex items-center gap-1">
            <ChevronRight size={14} className="text-gray-500" />
            <span
              className="cursor-pointer hover:text-blue-600"
              onClick={() => goTo(i)}
            >
              {part}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
