"use client";

import { useFileExplorer } from "./FileExplorerContext";
import { ChevronRight, ChevronUp, Copy, Scissors, Trash2, Clipboard } from "lucide-react";
import { API } from "@/app/lib/api";

export default function Topbar() {
  const { currentPath, setCurrentPath, clipboard, setClipboard, reload ,selectedItem } = useFileExplorer();

  const createFolder = async () => {
    const name = prompt("Folder Name:");
    if (!name) return;

    try {
      await API.post("/directory", { path: `${currentPath}/${name}`, permissions: 0o755 });
      reload();
    } catch (err) {
      console.error("Failed to create folder:", err);
      alert("Error creating folder");
    }
  };

  const goUp = () => {
    const parts = currentPath.split("/").filter(Boolean);
    const newPath = "/" + parts.slice(0, parts.length - 1).join("/");
    setCurrentPath(newPath || "/");
  };

 const pasteItem = async () => {
        console.log("gone yeah")
  if (!clipboard) return;
    console.log("go")
  try {
    await API.post("/paste", {
      sourcePath: clipboard.fullPath, // use the original path
      destinationPath: `${currentPath}/${clipboard.item.name}`,
      action: clipboard.action,
    });
    setClipboard(null);
    reload();
  } catch (err) {
    console.error("Failed to paste item:", err);
    alert("Error pasting item");
  }
};


  const deleteItem = async () => {
    if (!clipboard) return;
    try {
      await API.delete(`/node`, { path: `${currentPath}/${clipboard.item.name}` });
      setClipboard(null);
      reload();
    } catch (err) {
      console.error("Failed to delete item:", err);
      alert("Error deleting item");
    }
  };

  return (
    <div className="flex flex-col border-b">
      <div className="h-14 bg-white flex items-center gap-2 px-4">
        <button onClick={reload} className="p-2 bg-gray-200 rounded">⟳</button>
        <button onClick={createFolder} className="p-2 bg-blue-500 text-white rounded">New Folder</button>

        <button
  onClick={() => {
    if (!selectedItem) return alert("No item selected");
    setClipboard({
      item: selectedItem,
      action: "copy",
      fullPath: `${currentPath}/${selectedItem.name}`
    });
  }}
  className="p-2 hover:bg-gray-100 rounded text-neutral-600"
>
  <Copy size={16} />
</button>

<button
  onClick={() => {
    if (!selectedItem) return alert("No item selected");
    setClipboard({
      item: selectedItem,
      action: "cut",
      fullPath: `${currentPath}/${selectedItem.name}`
    });
  }}
  className="p-2 hover:bg-gray-100 rounded text-neutral-600"
>
  <Scissors size={16} />
</button>

        <button onClick={pasteItem} className="p-2 hover:bg-gray-100 rounded text-neutral-600" disabled={!clipboard}>
          <Clipboard size={16} />
        </button>
        <button onClick={deleteItem} className="p-2 hover:bg-red-100 rounded text-neutral-600">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 border-t">
        <button onClick={goUp} className="px-2 py-1 border rounded bg-white hover:bg-gray-50">
          <ChevronUp size={16} />
        </button>

        <div className="flex items-center gap-1 bg-white px-3 py-1 rounded border overflow-x-auto whitespace-nowrap">
          {currentPath === "/" ? (
            <span>/</span>
          ) : (
            currentPath.split("/").filter(Boolean).map((p, i, arr) => (
              <span
                key={i}
                className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
                onClick={() => setCurrentPath("/" + arr.slice(0, i + 1).join("/"))}
              >
                {i > 0 && <ChevronRight size={14} />}
                {p}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
