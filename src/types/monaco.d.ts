declare global {
  interface Window {
    monaco: typeof import('monaco-editor');
    openFileInEditor?: (path: string, name: string) => void;
  }
}

export {};
