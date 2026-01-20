# VIRAITH IDE

> Observe. Compare. Build.

A desktop IDE that combines project management with development tools. The first Kanban board that codes.

## Overview

VIRAITH IDE is a unified development environment where moving a task card doesn't just change status—it can execute work. Built with Tauri 2.0 for a lightweight, fast, and secure desktop experience.

## Features (Phase 1)

- **Kanban Board** - Drag-and-drop task management with @dnd-kit
- **Card Context** - Attach folders to cards for agent context
- **File Explorer** - Browse project files with tree view
- **Terminal** - Built-in terminal interface (placeholder, full xterm.js in Phase 2)
- **Git Integration** - Ghost branches for isolated changes
- **Live Preview** - Preview your app within the IDE
- **Signal Feed** - Real-time event logging

## Tech Stack

### Frontend
- React 19 + Next.js 15.2
- TypeScript 5.7
- Tailwind CSS 4
- Zustand (state management)
- @dnd-kit (drag and drop)
- Framer Motion (animations)

### Backend (Tauri)
- Rust
- SQLite (rusqlite)
- git2 (Git operations)
- notify (file watching)

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- Rust (for Tauri)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd viraith-ide

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri:dev

# Build for production
pnpm tauri:build
```

## Project Structure

```
viraith-ide/
├── src/                    # React frontend
│   ├── app/               # Next.js app router
│   ├── components/        # React components
│   │   ├── kanban/       # Kanban board components
│   │   ├── layout/       # Layout components
│   │   ├── preview/      # Live preview
│   │   ├── signal/       # Signal feed
│   │   └── terminal/     # Terminal component
│   ├── lib/              # Utilities and API bindings
│   ├── store/            # Zustand stores
│   └── types/            # TypeScript types
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── commands/     # Tauri commands
│   │   ├── database/     # SQLite operations
│   │   ├── files.rs      # File operations
│   │   └── git.rs        # Git operations
│   └── Cargo.toml
├── documentation/         # Project documentation
└── claude/               # Claude skill files
```

## Design

VIRAITH uses a terminal-inspired "Caffeine" theme:
- Dark background (#0a0a0a)
- Muted accent colors (warm amber #b8956b)
- JetBrains Mono typography
- Minimal, focused UI without harsh colors

## Phase 2 (Coming Soon)

- LLM-powered agent execution
- Voice commands (Whisper)
- Multi-agent swarm coordination
- Natural language terminal
- Gamification and analytics

## License

MIT
