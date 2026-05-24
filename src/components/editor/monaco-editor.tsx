"use client";

import React from "react";
import Editor, { DiffEditor, EditorProps } from "@monaco-editor/react";

interface CodeEditorProps extends Omit<EditorProps, "theme"> {
  theme?: "vs-dark" | "light";
  readOnly?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  theme = "vs-dark",
  height = "500px",
  options,
  onMount,
  ...props
}: CodeEditorProps) {
  const defaultOptions: EditorProps["options"] = {
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: "var(--font-geist-mono), monospace",
    lineHeight: 22,
    wordWrap: "on",
    automaticLayout: true,
    readOnly,
    contextmenu: true, // Enable Monaco editor context menu
    mouseWheelZoom: true, // Enable mouse wheel zoom in Monaco
    padding: { top: 12, bottom: 12 },
    scrollbar: {
      vertical: "auto",
      horizontal: "auto",
    },
    ...options,
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    if (onMount) {
      onMount(editor, monaco);
    }

    // Ensure the editor receives focus
    editor.focus();

    // Register a custom "Paste" action in Monaco's custom context menu
    editor.addAction({
      id: "custom-paste-menu-item",
      label: "Paste",
      contextMenuGroupId: "9_cutcopypaste",
      contextMenuOrder: 3,
      run: async (ed: any) => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            const selection = ed.getSelection();
            if (selection) {
              const range = new monaco.Range(
                selection.startLineNumber,
                selection.startColumn,
                selection.endLineNumber,
                selection.endColumn
              );
              
              const op = {
                range,
                text,
                forceMoveMarkers: true,
              };
              ed.executeEdits("context-menu-paste", [op]);

              const lines = text.split("\n");
              const lineCount = lines.length;
              const lastLineLength = lines[lineCount - 1].length;

              const newEndLine = selection.startLineNumber + lineCount - 1;
              const newEndColumn =
                lineCount === 1
                  ? selection.startColumn + lastLineLength
                  : lastLineLength + 1;

              ed.setSelection(
                new monaco.Selection(
                  newEndLine,
                  newEndColumn,
                  newEndLine,
                  newEndColumn
                )
              );
            }
          }
        } catch (err) {
          console.error("Monaco context menu paste failed:", err);
        }
      },
    });

    const domNode = editor.getDomNode();
    if (domNode) {
      // Direct click events to focus the editor
      domNode.addEventListener("click", () => {
        editor.focus();
      });

      // Capture external clipboard paste events
      domNode.addEventListener(
        "paste",
        (e: ClipboardEvent) => {
          if (readOnly) return;

          const text = e.clipboardData?.getData("text/plain");
          if (text) {
            const selection = editor.getSelection();
            if (selection) {
              const range = new monaco.Range(
                selection.startLineNumber,
                selection.startColumn,
                selection.endLineNumber,
                selection.endColumn
              );
              
              // Apply the edit
              const op = {
                range,
                text,
                forceMoveMarkers: true,
              };
              editor.executeEdits("clipboard-paste", [op]);

              // Calculate new cursor position at the end of the pasted text
              const lines = text.split("\n");
              const lineCount = lines.length;
              const lastLineLength = lines[lineCount - 1].length;

              const newEndLine = selection.startLineNumber + lineCount - 1;
              const newEndColumn =
                lineCount === 1
                  ? selection.startColumn + lastLineLength
                  : lastLineLength + 1;

              editor.setSelection(
                new monaco.Selection(
                  newEndLine,
                  newEndColumn,
                  newEndLine,
                  newEndColumn
                )
              );

              e.preventDefault();
              e.stopPropagation();
            }
          }
        },
        true // Use capture phase to intercept before internal blockers
      );
    }
  };

  return (
    <div className="w-full h-full border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        theme={theme}
        options={defaultOptions}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full text-zinc-400 bg-zinc-950 min-h-[300px]">
            <span className="animate-pulse text-sm">Loading Monaco Editor...</span>
          </div>
        }
        {...props}
      />
    </div>
  );
}

interface CodeDiffEditorProps {
  original: string;
  modified: string;
  originalLanguage: string;
  modifiedLanguage: string;
  theme?: string;
  height?: string;
}

export function CodeDiffEditor({
  original,
  modified,
  originalLanguage,
  modifiedLanguage,
  theme = "vs-dark",
  height = "500px",
}: CodeDiffEditorProps) {
  const options = {
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: "var(--font-geist-mono), monospace",
    lineHeight: 22,
    wordWrap: "on" as const,
    automaticLayout: true,
    readOnly: true,
    renderSideBySide: true,
    padding: { top: 12, bottom: 12 },
  };

  return (
    <div className="w-full h-full border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
      <DiffEditor
        height={height}
        original={original}
        modified={modified}
        language={modifiedLanguage}
        theme={theme}
        options={options}
        loading={
          <div className="flex items-center justify-center h-full text-zinc-400 bg-zinc-950 min-h-[300px]">
            <span className="animate-pulse text-sm">Loading Diff Editor...</span>
          </div>
        }
      />
    </div>
  );
}
