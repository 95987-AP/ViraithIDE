'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { X, Save, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fileApi, isTauri } from '@/lib/tauri';

interface OpenFile {
  path: string;
  name: string;
  content: string;
  modified: boolean;
}

interface CodeEditorProps {
  className?: string;
}

// Language mapping for Monaco
const getLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'mts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'mjs':
      return 'javascript';
    case 'jsx':
      return 'javascript';
    case 'json':
      return 'json';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'less':
      return 'less';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'py':
      return 'python';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'c':
    case 'h':
      return 'c';
    case 'cs':
      return 'csharp';
    case 'php':
      return 'php';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'xml':
      return 'xml';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'tsx':
      return 'typescript';
    case 'vue':
      return 'vue';
    case 'svelte':
      return 'svelte';
    default:
      return 'plaintext';
  }
};

export function CodeEditor({ className }: CodeEditorProps) {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<OpenFile | null>(null);
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<any>(null);

  // Open a file
  const openFile = useCallback(async (path: string, name: string) => {
    setLoading(true);
    try {
      // Check if file is already open
      const existingFile = openFiles.find((f) => f.path === path);
      if (existingFile) {
        setActiveFile(existingFile);
        setLoading(false);
        return;
      }

      // Read file content
      let content = '';
      if (isTauri) {
        content = await fileApi.read(path);
      } else {
        // Mock content for browser
        content = `// ${name}\n// File content would appear here in Tauri\n`;
      }

      const newFile: OpenFile = {
        path,
        name,
        content,
        modified: false,
      };

      setOpenFiles((prev) => [...prev, newFile]);
      setActiveFile(newFile);
    } catch (error) {
      console.error('Failed to open file:', error);
    } finally {
      setLoading(false);
    }
  }, [openFiles]);

  // Close a file
  const closeFile = useCallback((path: string) => {
    setOpenFiles((prev) => {
      const newFiles = prev.filter((f) => f.path !== path);
      if (activeFile?.path === path) {
        // Set new active file
        const index = prev.findIndex((f) => f.path === path);
        setActiveFile(index > 0 ? prev[index - 1] : newFiles[0] || null);
      }
      return newFiles;
    });
  }, [activeFile]);

  // Save a file
  const saveFile = useCallback(async (file: OpenFile) => {
    try {
      if (isTauri) {
        // Use Tauri's fs plugin to write file
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        await writeTextFile(file.path, file.content);
      }

      // Mark as not modified
      setOpenFiles((prev) =>
        prev.map((f) => (f.path === file.path ? { ...f, modified: false } : f))
      );
      if (activeFile?.path === file.path) {
        setActiveFile((prev) => prev ? { ...prev, modified: false } : null);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }, [activeFile]);

  // Handle editor content change
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!activeFile) return;

    const newContent = value ?? '';
    const modified = newContent !== activeFile.content;

    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === activeFile.path
          ? { ...f, content: newContent, modified }
          : f
      )
    );
    setActiveFile((prev) => prev ? { ...prev, content: newContent, modified } : null);
  }, [activeFile]);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: any) => {
    editorRef.current = editor;

    // Set up keyboard shortcuts
    editor.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KeyS, () => {
      if (activeFile) {
        saveFile(activeFile);
      }
    });
  }, [activeFile, saveFile]);

  // Expose openFile method globally for the sidebar to use
  useEffect(() => {
    (window as any).openFileInEditor = openFile;
  }, [openFile]);

  return (
    <div className={cn('flex flex-col h-full bg-surface', className)}>
      {/* Tabs */}
      {openFiles.length > 0 && (
        <div className="flex items-center border-b border-border-subtle bg-surface-elevated overflow-x-auto">
          {openFiles.map((file) => (
            <div
              key={file.path}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-mono border-r border-border-subtle',
                'hover:bg-surface-hover cursor-pointer transition-colors min-w-0 max-w-48',
                activeFile?.path === file.path
                  ? 'bg-surface text-text-primary border-b-2 border-b-accent'
                  : 'text-text-secondary'
              )}
              onClick={() => setActiveFile(file)}
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{file.name}</span>
              {file.modified && (
                <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.path);
                }}
                className="ml-1 p-0.5 rounded hover:bg-surface-hover opacity-0 group-hover:opacity-100 hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="text-text-muted text-sm font-mono">Loading...</div>
          </div>
        )}

        {activeFile ? (
          <div className="h-full flex flex-col">
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-surface-elevated">
              <div className="flex items-center gap-2 text-xs font-mono text-text-dim">
                <span>{activeFile.name}</span>
                <span className="text-text-dim">•</span>
                <span>{activeFile.path}</span>
              </div>
              <div className="flex items-center gap-2">
                {activeFile.modified && (
                  <span className="text-2xs text-status-warning font-mono">Modified</span>
                )}
                <button
                  onClick={() => saveFile(activeFile)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded hover:bg-surface-hover text-text-secondary transition-colors"
                  title="Save (Cmd+S)"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={getLanguage(activeFile.name)}
                value={activeFile.content}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <FileText className="w-12 h-12 mb-4 text-text-dim" />
            <p className="text-sm font-mono">No file open</p>
            <p className="text-2xs text-text-dim mt-2">
              Open a file from the sidebar to start editing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
