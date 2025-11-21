"use client";

import { useFileExplorer } from "./FileExplorerContext";
import { ChevronRight, ChevronUp, Copy, Scissors, Trash2, Clipboard, CirclePlus, ChevronLeft, Terminal, Wand } from "lucide-react";
import { API } from "@/app/lib/api";
import { useState } from "react";

export default function Topbar() {
const {
  currentPath,
  setCurrentPath,
  clipboard,
  setClipboard,
  reload,
  selectedItem,

  editorContent,
  setEditorContent,
  editorOpen,
  setEditorOpen,
  editorPath,
  setEditorPath,
} = useFileExplorer();
  const [open, setOpen] = useState(false);
  const [cmdInput, setCmdInput] = useState("");

const [cmdOutput, setCmdOutput] = useState<string[]>([]);
  const [showCMD, setShowCMD] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
const [aiMessages, setAiMessages] = useState<{ role: string; text: string }[]>([]);
const [aiInput, setAiInput] = useState("");
  const runCMD = async () => {
  const input = cmdInput.trim();
  if (!input) return;

  setCmdOutput(prev => [...prev, "> " + input]);

  const [cmd, arg] = input.split(" ");

  if (cmd === "ls") {
  const dir = await API.get(`/directory?path=${encodeURIComponent(currentPath)}`);
  const names = dir.map((n: any) => n.name).join("  ");
  setCmdOutput(prev => [...prev, names]);
}

  else if (cmd === "cd") {
    if (arg === "..") {
      const newPath = currentPath.split("/").slice(0, -1).join("/") || "/";
      setCurrentPath(newPath);
      setCmdOutput(prev => [...prev, newPath]);
    } else {
      const newPath = currentPath === "/" ? `/${arg}` : `${currentPath}/${arg}`;
      setCurrentPath(newPath);
      setCmdOutput(prev => [...prev, newPath]);
    }
  }

  else if (cmd === "mkdir") {
    await API.post("/directory", {
      path: `${currentPath}/${arg}`,
      permissions: 0o755
    });
    setCmdOutput(prev => [...prev, `created folder "${arg}"`]);
    reload()
  }

  else {
    setCmdOutput(prev => [...prev, `Unknown command: ${cmd}`]);
  }

  setCmdInput("");
};

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
 const createTextFile = async (currentPath: string, reload: () => void) => {
  const name = prompt("File Name:");
  if (!name) return;

  try {
    await API.post("/file", {
      path: `${currentPath}/${name}`,
      content: "",
      permissions: 0o644,
    });
    reload();
  } catch (err) {
    console.error("Failed to create file:", err);
    alert("Error creating file");
  }

};

  const goUp = () => {
    const parts = currentPath.split("/").filter(Boolean);
    const newPath = "/" + parts.slice(0, parts.length - 1).join("/");
    setCurrentPath(newPath || "/");
  };

const typeIntoEditor = (
  text: string,
  setter: React.Dispatch<React.SetStateAction<string>>,
  speed: number
) => {
    let index = 0;
    const interval = setInterval(() => {
      console.log()
    setter((prev) =>{
      console.log(text[index])
      if(text[index]== undefined){
        return prev +' '
      }
      return prev + text[index]});
    index++;
    if (index === text.length) clearInterval(interval);
  }, speed);
};

const executeAICommand = async (cmd: any) => {
  try {
    console.log('this are ai commads',cmd)
    switch (cmd.action) {
      case "mkdir":
        await API.post("/directory", {
          path: `${currentPath}/${cmd.path}`,
          permissions: 0o755,
        });
        reload();
        break;


      case "create_file":
        await API.post("/file", {
          path: `${currentPath}/${cmd.path}`,
          content: "",
          permissions: 0o644,
        });
        reload();
        break;


      case "write":
        await API.put("/file", {
          path: `${currentPath}/${cmd.path}`,
          content: cmd.content || "",
        });
        reload();
        break;

case "create_and_write":
  await API.post("/file", {
    path: `${currentPath}/${cmd.path}`,
    content: "",
    permissions: 0o644,
  });

  reload();
  setShowAIAssistant(false);

  // prepare editor cleanly
  setEditorPath(`${currentPath}/${cmd.path}`);
  setEditorContent("");      // reset editor so 1st char isn't overwritten
  setEditorOpen(true);

  typeIntoEditor(cmd.content ?? "", setEditorContent, 15);

  break;
     case "open":
  setEditorPath(`${currentPath}/${cmd.path}`);
  setEditorOpen(true);

  // reset editor instantly (avoid animation)
  setEditorContent("");
  setEditorContent(cmd.content ?? ""); // direct set, no typeIntoEditor
  break;
      case "cd":
        setCurrentPath(cmd.path);
        break;

      /* ===== DELETE FILE/FOLDER ===== */
      case "delete":
        await API.delete("/node", { path: cmd.path });
        reload();
        break;


     case "ls": {
  const targetPath = cmd.path === "." ? currentPath : cmd.path;

  const dir = await API.get(`/directory?path=${encodeURIComponent(targetPath)}`);
  const list = dir.map((n: any) => n.name);

  setAiMessages(prev => [
    ...prev,
    { role: "assistant", text: " " + list.join(", ") }
  ]);

  break;
}


      default:
        setAiMessages(prev => [
          ...prev,
          { role: "assistant", text: `⚠ Unknown command: ${cmd.action}` }
        ]);
    }

  } catch (err) {
    console.error("CMD ERROR:", err);
    setAiMessages(prev => [
      ...prev,
      { role: "assistant", text: "⚠ Error executing the command." }
    ]);
  }
};


const sendToAI = async () => {
  const text = aiInput.trim();
  console.log("goging in ")

  if (!text) return;

  setAiMessages(prev => [...prev, { role: "user", text }]);
  setAiInput("");

  try {
    const res = await API.post("/ai", { prompt: text });

    const raw = res.output;
    if (!raw) throw new Error("Backend returned no output");

    const jsonStr = raw.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(jsonStr);


    const commands = Array.isArray(parsed) ? parsed : [parsed];

    setAiMessages(prev => [
      ...prev,
      { role: "assistant", text: "✔ Commands received. Executing…" }
    ]);
    console.log("commands",commands)
    for (const cmd of commands) {
      await executeAICommand(cmd);
    }

  } catch (err) {
    console.error("AI ERROR:", err);

    setAiMessages(prev => [
      ...prev,
      { role: "assistant", text: "⚠ Unable to process your request." }
    ]);
  }
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
      <div className="h-14 bg-folder  border-neutral-100/80 border-t border-b  flex items-center gap-2 px-4">

        <button onClick={reload} className="p-2  rounded cursor-pointer">⟳</button>
            <div className="h-7 w-px bg-white/40"></div>
      <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="p-2  text-neutral-200 rounded cursor-pointer flex items-center "
      ><CirclePlus className="size-3 text-greenfolder" />
      <span className="pl-1">  New</span>
        <svg
          className="ml-2 h-3 w-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute mt-2 w-40 rounded-md shadow-lg bg-folder/90  ring-1  ring-black/20 ring-opacity-5">
          <div className="py-1">
            <button
              onClick={createFolder}
              className="block w-full text-left px-4 py-2 text-sm text-white/80  hover:bg-gray-200/10"
            >
              📁 Folder
            </button>
            <button
              onClick={()=>createTextFile(currentPath,reload)}
              className="block w-full text-left px-4 py-2 text-sm text-white/80  hover:bg-gray-200/10"
            >
             📄 Text File
            </button>
          </div>
        </div>
      )}
    </div>
<div className="h-7 w-px bg-white/40"></div>
        <button
  onClick={() => {
    if (!selectedItem) return alert("No item selected");
    setClipboard({
      item: selectedItem,
      action: "copy",
      fullPath: `${currentPath}/${selectedItem.name}`
    });
  }}
  className="p-2 hover:bg-gray-100/10 hover:text-white rounded text-neutral-600 cursor-pointer"
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
  className="p-2 hover:bg-gray-100/10 hover:text-white rounded text-neutral-600 cursor-pointer"
>
  <Scissors size={16} />
</button>

        <button onClick={pasteItem} className="p-2 hover:bg-gray-100/10 hover:text-white cursor-pointer rounded text-neutral-600" disabled={!clipboard}>
          <Clipboard size={16} />
        </button>
        <button onClick={deleteItem} className="p-2 hover:bg-gray-100/10 hover:text-red-400 cursor-pointer rounded text-neutral-600">
          <Trash2 size={16} />
        </button>
        <button  className="p-2 hover:bg-gray-100/10 hover:text-greenfolder cursor-pointer rounded text-neutral-600">
          <Terminal
           onClick={() => setShowCMD(true)}
          size={16}/>
        </button>
      <button
  onClick={() => setShowAIAssistant(true)}
  className="p-2 hover:bg-gray-100/10 hover:text-sky-400 cursor-pointer rounded text-neutral-600"
>
  <Wand size={16}/>
</button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t">
        <button onClick={goUp} className="px-2 py-1 border rounded bg-folder hover:bg-gray-50/10">
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1 px-3 py-1 rounded border overflow-x-auto whitespace-nowrap">
          {currentPath === "/" ? (
            <span>/</span>
          ) : (
            currentPath.split("/").filter(Boolean).map((p, i, arr) => (
              <span
                key={i}
                className="flex items-center gap-1 cursor-pointer hover:text-greenfolder"
                onClick={() => setCurrentPath("/" + arr.slice(0, i + 1).join("/"))}
              >
                {i > 0 && <ChevronRight size={14} />}
                {p}
              </span>
            ))
          )}
        </div>
      </div>
      {showCMD && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-black text-green-400 p-4 w-[600px] rounded shadow-lg border border-green-600">

      <div className="flex justify-between mb-2">
        <h2 className="text-lg">Terminal</h2>
        <button onClick={() => setShowCMD(false)} className="text-red-400">✕</button>
      </div>


      <div className="h-64 overflow-auto bg-black border border-green-700 p-2 text-sm">
        {cmdOutput.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>


      <input
        autoFocus
        value={cmdInput}
        onChange={(e) => setCmdInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && runCMD()}
        className="w-full bg-black text-green-400 border border-green-600 mt-2 p-2 outline-none"
        placeholder="Enter command..."
      />
    </div>
  </div>
)}
{showAIAssistant && (
  <div className="fixed inset-0 bg-black/40 z-50">

    <div className="absolute right-0 top-0 h-full w-[380px] bg-[#0F1114] border-l border-white/10 shadow-xl flex flex-col">
     <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <div className="text-white font-semibold">AI Assistant</div>
        <button onClick={() => setShowAIAssistant(false)} className="text-red-400">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {aiMessages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg text-sm max-w-[85%] ${
              msg.role === "user"
                ? "bg-blue-600 text-white ml-auto"
                : "bg-gray-800 text-gray-200"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>


      <div className="p-3 border-t border-white/10 flex gap-2">
        <input
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendToAI()}
          className="flex-1 bg-[#1A1D21] text-white px-3 py-2 rounded outline-none border border-white/10"
          placeholder="Ask me to do something..."
        />
        <button
          onClick={sendToAI}
          className="px-4 py-2 text-sm font-medium bg-greenfolder text-neutral-200 rounded hover:opacity-80"
        >
          Send
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
