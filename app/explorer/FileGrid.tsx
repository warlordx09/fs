"use client";

import { useState, MouseEvent, useEffect, useRef } from "react";
import { API } from "@/app/lib/api";
import { useFileExplorer } from "./FileExplorerContext";

export type FSNode = {
  name: string;
  type: "file" | "directory";
  content?: string;
  children?: FSNode[];
};
type FileGridProps = {
  items: FSNode[];
};

export default function FileGrid({ items }: FileGridProps) {
  const { currentPath, setCurrentPath, clipboard, setClipboard, selectedItem, setSelectedItem, reload } = useFileExplorer();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FSNode | null } | null>(null);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);
  const [diskInfo, setDiskInfo] = useState<{ totalBytes: number; usedBytes: number; freeBytes: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState<FSNode[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [editorPath, setEditorPath] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  const loadRoot = async () => {
    try {

      const res = await API.get("/directory", { path: "/" });


      // Fetch disk usage info
      const diskRes = await API.get("/disk-usage", { path: "/" });
      setDiskInfo({
        totalBytes: diskRes.totalBytes,
        usedBytes: diskRes.usedBytes,
        freeBytes: diskRes.freeBytes,
      });

      setCurrentPath("/");
    } catch (err) {
      console.error("Failed to load root:", err);
    }
  };

  loadRoot();
}, []);
 const openItem = async (item: FSNode) => {
  setSelectedItem(item);

  const fullPath = `${currentPath}/${item.name}`;

  if (item.type === "directory") {
    const cached = cache.find(f => f.name === fullPath);

    if (cached) {

      setCurrentPath(fullPath);

      setLoading(false);
    } else {

      setLoading(true);
      try {
        const data = await new Promise<{ children: FSNode[] }>((resolve, reject) => {
          setTimeout(async () => {
            try {
              const res = await API.get("/directory", { path: fullPath });
              resolve(res);
            } catch (err) {
              reject(err);
            }
          }, 800);
        });

        setCurrentPath(fullPath);

        setLoading(false);


        const newCache = cache.filter(f => f.name !== fullPath);
        newCache.unshift({ name: fullPath, type: "directory", children: data.children });
        if (newCache.length > 3) newCache.pop();
        setCache(newCache);
      } catch (err) {
        console.error("Failed to open folder:", err);
        setErrorPopup("Unable to open folder.");
        setLoading(false);
      }
    }
    return;
  }


  const cached = cache.find(f => f.name === fullPath);
  setEditorPath(fullPath);
  setEditorOpen(true);

  if (cached) {
    setEditorContent(cached.content || "");
    setLoading(false);
  } else {
    setEditorContent("");
    setLoading(true);
    try {
      const data = await new Promise<{ content: string }>((resolve, reject) => {
        setTimeout(async () => {
          try {
            const res = await API.get("/file", { path: fullPath });
            resolve(res);
          } catch (err) {
            reject(err);
          }
        }, 1000);
      });

      setEditorContent(data.content || "");
      setLoading(false);

      const newCache = cache.filter(f => f.name !== fullPath);
      newCache.unshift({ name: fullPath, type: "file", content: data.content });
      if (newCache.length > 3) newCache.pop();
      setCache(newCache);
    } catch (err) {
      console.error("Failed to open file:", err);
      setErrorPopup("Unable to open file.");
      setLoading(false);
    }
  }
};

  const saveFile = async () => {
    try {
      await API.put("/file", {
        path: editorPath,
        content: editorContent,
      });


      const newCache = cache.filter(f => f.name !== editorPath);
      newCache.unshift({ name: editorPath, type: "file", content: editorContent });
      if (newCache.length > 3) newCache.pop();
      setCache(newCache);

      reload();
      setEditorOpen(false);
    } catch (err) {
      console.error("Failed to save file:", err);
      setErrorPopup("Failed to save file.");
    }
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
      fullPath: `${currentPath}/${item.name}`
    });
    setContextMenu(null);
  };

  const cutItem = (item: FSNode) => {
    setClipboard({
      item,
      action: "cut",
      fullPath: `${currentPath}/${item.name}`
    });
    setContextMenu(null);
  };

  const pasteItem = async () => {
    if (!clipboard) return;

    const destination = `${currentPath}/${clipboard.item.name}`;
    try {
      await API.post("/paste", {
        sourcePath: clipboard.fullPath,
        destinationPath: destination,
        action: clipboard.action,
      });setCache(prev =>
  prev.map(f =>
    f.name === currentPath && f.type === "directory"
      ? { ...f, children: items } // items = updated folder contents
      : f
  )
);

      setClipboard(null);
      reload();
      setContextMenu(null);
    } catch (err: any) {
      console.error("Failed to paste item:", err);
      setErrorPopup(err?.response?.data?.message || "Error pasting item.");
      setContextMenu(null);
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

      <div className="p-4 grid grid-cols-8 gap-4 select-none"
        onContextMenu={(e) => {
          e.preventDefault();
          const isItem = (e.target as HTMLElement).closest(".file-item");
          if (isItem) return;
          setSelectedItem(null);
          setContextMenu({ x: e.pageX, y: e.pageY, item: null });
        }}
      >
        {items.map((item) => {
          const isSelected = selectedItem?.name === item.name;
          return (
            <div
              key={item.name}
              onDoubleClick={() => openItem(item)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRightClick(e, item);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItem(item);
              }}
              className={`file-item py-1 px-0 border rounded cursor-pointer hover:bg-white/10 ${isSelected ? "bg-greenfolder/10 border-greenfolder" : "border-0"}`}
            >
              <div className="text-8xl text-center font-stretch-condensed tracking-tighter">{item.type === "directory" ? "📁" : "📄"}</div>
              <div className="text-center text-sm mt-2">{item.name}</div>
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <div
          className="fixed bg-folder/80 border backdrop-blur-sm border-white/10 rounded-lg shadow p-1 z-50 min-w-[120px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className="block w-full text-left px-2 py-1 hover:bg-white/10 rounded-sm" onClick={() => contextMenu.item && copyItem(contextMenu.item)}
            disabled={!contextMenu.item}>Copy</button>
          <button className="block w-full text-left px-2 py-1 hover:bg-white/10 rounded-sm" onClick={() => contextMenu.item && cutItem(contextMenu.item)}>Cut</button>
          <button className={`block w-full text-left px-2 py-1 hover:bg-white/10 rounded-sm ${!clipboard ? "opacity-50 cursor-not-allowed" : ""}`} onClick={pasteItem} disabled={!clipboard}>Paste</button>
          <button className="block w-full text-left px-2 py-1 hover:bg-white/10 rounded-sm text-red-500" onClick={() => contextMenu.item && deleteItem(contextMenu.item)}>Delete</button>
        </div>
      )}

      {errorPopup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="bg-[#1A1D21] text-[#FF383C] rounded-lg shadow-xl p-6 w-80">
            <div className="text-lg font-semibold mb-3">Error</div>
            <div className="text-sm mb-4">{errorPopup}</div>
            <button
              onClick={() => setErrorPopup(null)}
              className="px-3 py-1 border bg-greenfolder/20 border-greenfolder cursor-pointer text-white rounded text-xs"
            >
              Ok
            </button>
          </div>
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="bg-[#1A1D21] rounded-lg shadow-xl w-[600px] max-w-full">

            <div className="flex justify-between items-center px-4 py-2 border-b border-white/10">
              <div className="text-white text-sm">{editorPath}</div>
              <button
                onClick={() => setEditorOpen(false)}
                className="text-red-400 hover:text-red-300 cursor-pointer text-sm"
              >
                ✖ Close
              </button>
            </div>


            {loading ? (
              <div className="w-full h-80 bg-[#1A1D21] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/30 border-t-2 border-white"></div>
                <span className="ml-3 text-white">Reading from disk...</span>
              </div>
            ) : (
              <textarea
                className="w-full h-80 bg-[#0F1114] text-white p-4 outline-none resize-none"
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
              />
            )}


            {!loading && (
              <div className="flex justify-end border-t border-white/10 px-4 py-2">
                <button
                  onClick={saveFile}
                  className="px-4 py-1 bg-greenfolder/20 border border-greenfolder text-greenfolder rounded cursor-pointer"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      )}
     {loading && !editorOpen && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
    <div className="flex items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 border-t-2 border-white"></div>
      <span className="ml-3 text-white text-lg font-medium">Loading folder...</span>
    </div>
  </div>
)}

    </div>
  );
}
