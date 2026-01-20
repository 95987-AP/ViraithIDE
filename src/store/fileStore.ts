import { create } from 'zustand';
import { fileApi, isTauri } from '@/lib/tauri';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface FileState {
  // Data
  projectPath: string | null;
  fileTree: FileNode | null;
  expandedFolders: Set<string>;
  isLoading: boolean;

  // Actions
  setProjectPath: (path: string | null) => void;
  setFileTree: (tree: FileNode | null) => void;
  toggleFolder: (path: string) => void;
  expandFolder: (path: string) => void;

  // Load and refresh
  loadFolder: (folderPath: string) => Promise<void>;
  refreshFileTree: () => Promise<void>;
  clearProject: () => void;
}

const STORAGE_KEY = 'viraith_project_path';

// Helper to convert API response to FileNode format
const convertNode = (node: any): FileNode => ({
  name: node.name,
  path: node.path,
  type: node.is_directory || node.isDirectory ? 'folder' : 'file',
  children: node.children?.map(convertNode),
});

export const useFileStore = create<FileState>((set, get) => ({
  projectPath: null,
  fileTree: null,
  expandedFolders: new Set(),
  isLoading: false,

  setProjectPath: (path) => set({ projectPath: path }),

  setFileTree: (tree) => set({ fileTree: tree }),

  toggleFolder: (path) => {
    const { expandedFolders } = get();
    const next = new Set(expandedFolders);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    set({ expandedFolders: next });
  },

  expandFolder: (path) => {
    const { expandedFolders } = get();
    if (!expandedFolders.has(path)) {
      const next = new Set(expandedFolders);
      next.add(path);
      set({ expandedFolders: next });
    }
  },

  loadFolder: async (folderPath: string) => {
    set({ isLoading: true });
    try {
      const tree = await fileApi.getTree(folderPath);
      const converted = convertNode(tree);

      set({
        fileTree: converted,
        projectPath: folderPath,
        expandedFolders: new Set([converted.path]),
        isLoading: false,
      });

      // Save to localStorage for persistence
      localStorage.setItem(STORAGE_KEY, folderPath);
    } catch (error) {
      console.error('Failed to load folder:', error);
      set({ isLoading: false });
    }
  },

  refreshFileTree: async () => {
    const { projectPath } = get();
    if (!projectPath) return;

    try {
      const tree = await fileApi.getTree(projectPath);
      const converted = convertNode(tree);

      // Keep expanded folders state
      set({ fileTree: converted });
    } catch (error) {
      console.error('Failed to refresh file tree:', error);
    }
  },

  clearProject: () => {
    set({
      fileTree: null,
      projectPath: null,
      expandedFolders: new Set(),
    });
    localStorage.removeItem(STORAGE_KEY);
  },
}));

// Initialize from localStorage on first load
if (typeof window !== 'undefined') {
  const savedPath = localStorage.getItem(STORAGE_KEY);
  if (savedPath) {
    // Delay to ensure store is ready
    setTimeout(() => {
      useFileStore.getState().loadFolder(savedPath);
    }, 0);
  }
}
