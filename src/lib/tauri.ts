// Tauri API bindings
// Provides type-safe wrappers for Tauri commands

import { invoke } from '@tauri-apps/api/core';
import type { Board, Card, Column, FileNode, Project } from '@/types';

// Check if running in Tauri context
export const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Project commands
export const projectApi = {
  create: async (name: string, rootPath: string): Promise<Project> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('create_project', { name, rootPath });
  },

  getAll: async (): Promise<Project[]> => {
    if (!isTauri) return [];
    return invoke('get_projects');
  },

  delete: async (id: string): Promise<void> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('delete_project', { id });
  },
};

// Board commands
export const boardApi = {
  getAll: async (projectId: string): Promise<Board[]> => {
    if (!isTauri) return [];
    return invoke('get_boards', { projectId });
  },

  create: async (projectId: string, name: string, position: number): Promise<Board> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('create_board', { projectId, name, position });
  },
};

// Column commands
export const columnApi = {
  getAll: async (boardId: string): Promise<Column[]> => {
    if (!isTauri) return [];
    return invoke('get_columns', { boardId });
  },

  create: async (boardId: string, name: string, position: number): Promise<Column> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('create_column', { boardId, name, position });
  },

  update: async (id: string, name: string, position: number): Promise<void> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('update_column', { id, name, position });
  },

  delete: async (id: string): Promise<void> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('delete_column', { id });
  },
};

// Card commands
export const cardApi = {
  getAll: async (columnId: string): Promise<Card[]> => {
    if (!isTauri) return [];
    return invoke('get_cards', { columnId });
  },

  create: async (
    columnId: string,
    title: string,
    description: string | null,
    position: number
  ): Promise<Card> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('create_card', { columnId, title, description, position });
  },

  update: async (
    id: string,
    title: string,
    description: string | null,
    status: string
  ): Promise<void> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('update_card', { id, title, description, status });
  },

  move: async (id: string, columnId: string, position: number): Promise<void> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('move_card', { id, columnId, position });
  },

  attachFolder: async (id: string, folderPath: string): Promise<void> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('attach_folder', { id, folderPath });
  },

  delete: async (id: string): Promise<void> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('delete_card', { id });
  },

  execute: async (cardId: string): Promise<string> => {
    if (!isTauri) return 'Not in Tauri context';
    return invoke('execute_card_placeholder', { cardId });
  },
};

// File commands
export const fileApi = {
  getTree: async (projectPath: string): Promise<FileNode> => {
    if (!isTauri) {
      // Return mock data for browser development
      return {
        name: 'project',
        path: projectPath,
        isDirectory: true,
        children: [
          {
            name: 'src',
            path: `${projectPath}/src`,
            isDirectory: true,
            children: [
              { name: 'app.tsx', path: `${projectPath}/src/app.tsx`, isDirectory: false },
            ],
          },
          { name: 'package.json', path: `${projectPath}/package.json`, isDirectory: false },
        ],
      };
    }
    return invoke('get_file_tree', { projectPath });
  },

  read: async (path: string): Promise<string> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('read_file', { path });
  },

  write: async (path: string, content: string): Promise<void> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('write_file', { path, content });
  },

  create: async (path: string, content: string = ''): Promise<void> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('create_file', { path, content });
  },

  createDirectory: async (path: string): Promise<void> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('create_directory', { path });
  },

  delete: async (path: string): Promise<void> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('delete_file', { path });
  },

  exists: async (path: string): Promise<boolean> => {
    if (!isTauri) return false;
    return invoke('file_exists', { path });
  },

  openFolderDialog: async (): Promise<string | null> => {
    if (!isTauri) return null;
    return invoke('open_folder_dialog');
  },
};

// Git commands
export const gitApi = {
  getBranches: async (repoPath: string) => {
    if (!isTauri) return [];
    return invoke('get_branches', { repoPath });
  },

  createGhostBranch: async (repoPath: string, cardId: string): Promise<string> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('create_ghost_branch', { repoPath, cardId });
  },

  getDiff: async (repoPath: string, branch1: string, branch2: string): Promise<string> => {
    if (!isTauri) return '';
    return invoke('get_branch_diff', { repoPath, branch1, branch2 });
  },

  mergeGhostBranch: async (repoPath: string, ghostBranch: string): Promise<void> => {
    if (!isTauri) throw new Error('Not in Tauri context');
    return invoke('merge_ghost_branch', { repoPath, ghostBranch });
  },
};

// Shell commands for revealing files in Finder/Explorer
export const shellApi = {
  revealInFinder: async (path: string): Promise<void> => {
    if (!isTauri) return;
    return invoke('reveal_in_finder', { path });
  },

  openPath: async (path: string): Promise<void> => {
    if (!isTauri) return;
    return invoke('open_path', { path });
  },
};

// Window commands
export const windowApi = {
  minimize: async (): Promise<void> => {
    if (!isTauri) return;
    return invoke('minimize_window');
  },

  maximize: async (): Promise<void> => {
    if (!isTauri) return;
    return invoke('maximize_window');
  },

  close: async (): Promise<void> => {
    if (!isTauri) return;
    return invoke('close_window');
  },
};
