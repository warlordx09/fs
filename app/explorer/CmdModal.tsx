"use client";
import { useState } from "react";
import { API } from "@/app/lib/api";
import { X } from "lucide-react";

export default function CmdModal({ currentPath, onClose, onNavigate }: any) {
  const [logs, setLogs] = useState<string[]>([]);
  const [cmd, setCmd] = useState("");

  const runCmd = async () => {
    const [command, arg] = cmd.trim().split(" ");

    let newLogs = [...logs, `> ${cmd}`];

    try {
      // --- ls ---
      if (command === "ls") {
        const res = await API.get("/directory", { params: { path: currentPath } as any });
        newLogs.push(JSON.stringify(res.data, null, 2));
      }

      // --- cd ---
      else if (command === "cd") {
        if (arg === "..") {
          const parent = currentPath.split("/").slice(0, -1).join("/") || "/";
          onNavigate(parent);
          newLogs.push(`Moved to ${parent}`);
        } else {
          const target = currentPath === "/" ? `/${arg}` : `${currentPath}/${arg}`;
          onNavigate(target);
          newLogs.push(`Moved to ${target}`);
        }
      }

      // --- mkdir ---
      else if (command === "mkdir") {
        await API.post("/directory", {
          path: `${currentPath}/${arg}`,
          permissions: 0o755,
        });
        newLogs.push(`Created folder: ${arg}`);
      }

      else newLogs.push(`Unknown command: ${command}`);
    } catch (err) {
      newLogs.push("Error: " + String(err));
    }

    setLogs(newLogs);
    setCmd("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="
        bg-black/90 border border-greenfolder/50 w-[600px] h-[420px]
        rounded-xl shadow-xl shadow-black/50 flex flex-col
      ">

        {/* HEADER */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-greenfolder/40">
          <h2 className="text-greenfolder text-lg font-semibold">Terminal</h2>

          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* OUTPUT AREA */}
        <div className="flex-1 overflow-auto p-3 font-mono text-green-300 text-sm bg-black/60">
          {logs.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap leading-relaxed">
              {line}
            </div>
          ))}
        </div>

        {/* INPUT BAR */}
        <div className="p-3 border-t border-greenfolder/40">
          <input
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runCmd()}
            placeholder="Enter command..."
            className="
              w-full px-3 py-2 rounded bg-black/70 text-greenfolder
              border border-greenfolder/40 outline-none font-mono
            "
          />
        </div>
      </div>
    </div>
  );
}
