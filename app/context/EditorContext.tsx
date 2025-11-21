"use client";
import { createContext, useContext, useState } from "react";

const EditorContext = createContext<any>(null);

export const EditorProvider = ({ children }: any) => {
  const [editorPath, setEditorPath] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <EditorContext.Provider value={{
      editorPath, setEditorPath,
      editorContent, setEditorContent,
      editorOpen, setEditorOpen
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => useContext(EditorContext);
