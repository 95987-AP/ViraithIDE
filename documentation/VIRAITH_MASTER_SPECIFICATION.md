# VIRAITH IDE - Complete Master Specification
**Version:** 3.0.0 - MASTER DOCUMENT  
**Created:** January 18, 2026  
**Status:** Production-Ready Blueprint

---

## ⚠️ IMPORTANT: IMPLEMENTATION PHASES (READ THIS FIRST!)

### 🔴 Phase 1: CORE FOUNDATION (Build This First)
**Agent Instructions:** Focus ONLY on these features for the initial implementation. Do NOT implement AI/LLM features yet.

**Build immediately:**
- ✅ Tauri desktop shell (window, menus, IPC)
- ✅ Database setup (SQLite schema, migrations)
- ✅ Kanban Board UI (drag-drop with @dnd-kit)
- ✅ File explorer / folder picker
- ✅ Basic card CRUD operations (create, read, update, delete)
- ✅ Folder attachment to cards (drag & drop)
- ✅ Basic terminal (xterm.js + portable-pty)
- ✅ Git integration (git2 - branches, commits)
- ✅ Live Preview window (BrowserView integration)
- ✅ Basic UI/UX (Tailwind CSS styling)

**What to skip for now:**
- ❌ LLM/Claude API integration (agents, voice, etc.)
- ❌ Whisper voice recognition
- ❌ Natural language parsing
- ❌ Agent orchestrator/swarm logic
- ❌ Gamification system
- ❌ Advanced analytics

### 🟡 Phase 2: AI INTEGRATION (Build Later With User Assistance)
**These features require:**
- API keys (Claude, Whisper)
- User's approval for specific implementations
- Fine-tuning of prompts
- Testing with real projects

**Will be implemented later:**
- LLM-powered agent execution
- Multi-agent swarm coordination (LangGraph)
- Voice transcription (Whisper)
- Natural language terminal commands
- Clarifier agent
- Hive Mind (cross-project learning)
- XP/Gamification calculations

### 📝 For The Agent Building Phase 1:

**DO:**
- Create placeholder functions for AI features (e.g., `execute_card_with_agent()` returns mock success)
- Add UI buttons/interfaces for AI features (they just show "Coming Soon" for now)
- Structure code so AI features can be plugged in later
- Add comments like `// TODO: Integrate Claude API here`

**DON'T:**
- Try to implement LLM calls without API keys
- Create complex agent logic that won't work without AI
- Spend time on prompt engineering
- Implement voice recognition

### 🎯 Success Criteria for Phase 1:
User should be able to:
1. Create a project and see a Kanban board
2. Create cards and move them between columns
3. Drag folders onto cards
4. See a terminal and run commands
5. Open a live preview window
6. Create ghost Git branches manually
7. Navigate the UI smoothly

**Phase 2 will add the "intelligence" - for now, just build the shell.**

---

## 📖 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Concept](#2-core-concept)
3. [Tech Stack (2026 Best-in-Class)](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Database Schema](#5-database-schema)
6. [Feature 1: Kanban Board](#6-feature-1-kanban-board)
7. [Feature 2: Folder Context System](#7-feature-2-folder-context)
8. [Feature 3: Multi-Agent Swarm](#8-feature-3-multi-agent-swarm) ⚠️ PHASE 2
9. [Feature 4: Voice Director (Whisper)](#9-feature-4-voice-director) ⚠️ PHASE 2
10. [Feature 5: The Clarifier Agent](#10-feature-5-clarifier-agent) ⚠️ PHASE 2
11. [Feature 6: Ghost Mode](#11-feature-6-ghost-mode)
12. [Feature 7: Time Machine](#12-feature-7-time-machine)
13. [Feature 8: Hive Mind](#13-feature-8-hive-mind) ⚠️ PHASE 2
14. [Feature 9: Live Preview](#14-feature-9-live-preview)
15. [Feature 10: Vibe Terminal](#15-feature-10-vibe-terminal)
16. [Feature 11: Galaxy View](#16-feature-11-galaxy-view)
17. [Feature 12: Gamification (Stats)](#17-feature-12-gamification) ⚠️ PHASE 2
18. [Feature 13: Signal Feed](#18-feature-13-signal-feed)
19. [UI/UX Design System](#19-uiux-design)
20. [Security Model](#20-security)
21. [Testing Strategy](#21-testing)
22. [Performance Targets](#22-performance)
23. [Deployment](#23-deployment)

---

## 1. Project Overview

**Name:** VIRAITH IDE  
**Tagline:** "Observe. Compare. Build."  
**Category:** Desktop Development Environment  
**Target Users:** 
- Solo developers & indie hackers
- Student developers
- Small dev teams (2-5 people)

**Problem Solved:**
Developers waste time switching between:
- Jira/Trello (planning)
- VS Code (coding)
- Browser (testing)
- Terminal (running commands)
- Chat (coordinating with AI)

**Solution:**
A unified desktop app where "moving a card" doesn't just change status—it executes work.

---

## 2. Core Concept

### "The First Kanban Board That Codes"

**The Innovation:**
- Each task card is an autonomous agent
- Drag a folder onto a card → agent has context
- Click "Execute" → agent writes code
- Multiple agents coordinate in a "Swarm Room"
- Voice commands create and route tasks
- Built-in terminal understands natural language
- Live preview shows changes without leaving the app

### The Workflow
```
1. User speaks: "Create a login form"
2. Voice → Transcribed → Routed to Frontend Agent
3. Card created in "To-Do" column
4. User drags /components folder onto card
5. User clicks "Execute" button
6. Agent reads files, writes code, commits to ghost branch
7. User sees live preview in split view
8. User approves → Ghost branch merges to main
9. Card moves to "Done"
```

---

## 3. Tech Stack (2026 Best-in-Class)

### Why Tauri (Not Electron)
- **96% smaller** bundles (4.8MB vs 125MB)
- **58% less RAM** (120MB vs 380MB)
- **10x faster startup** (0.4s vs 3.2s)
- Better security (Rust + native WebView)
- Production-ready (used by Discord, Figma)

### Desktop Framework
```toml
[dependencies]
# Core
tauri = "2.1"
tauri-plugin-fs = "2.0"
tauri-plugin-shell = "2.0"
tauri-plugin-sql = "2.0"
tauri-plugin-dialog = "2.0"

# Database
rusqlite = { version = "0.32", features = ["bundled"] }
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "sqlite"] }

# Git
git2 = "0.19"

# Terminal
alacritty_terminal = "0.24"
portable-pty = "0.8"
vte = "0.13"

# File Operations
notify = "7.0"
walkdir = "2.5"
ignore = "0.4"

# Search
ripgrep = "14.1"
fuzzy-matcher = "0.3"

# ⚠️ PHASE 2: AI Dependencies (add later)
# reqwest = { version = "0.12", features = ["json"] }
# whisper-rs = "0.12"

# Utilities
uuid = { version = "1.10", features = ["v4"] }
chrono = "0.4"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.40", features = ["full"] }
```

### Frontend
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next": "^15.2.0",

    "@tanstack/react-query": "^5.59.0",
    "zustand": "^5.0.2",

    "@dnd-kit/core": "^6.3.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.0",

    "tailwindcss": "^4.0.0",
    "framer-motion": "^12.0.0",

    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",

    "@xterm/xterm": "^5.5.0",
    "@xterm/addon-fit": "^0.10.0",
    "@xterm/addon-web-links": "^0.11.0",
    "@xterm/addon-search": "^0.15.0",

    "cmdk": "^1.0.0",
    "fuse.js": "^7.0.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@tauri-apps/cli": "^2.1.0",
    "turbo": "^2.3.0",
    "vitest": "^2.1.8",
    "@playwright/test": "^1.50.0",
    "prettier": "^3.4.2",
    "eslint": "^9.18.0"
  }
}
```

### Build Tools
- **Bundler:** Turbopack (Rust-based, 10x faster than Webpack)
- **Package Manager:** pnpm (faster, better monorepo support)
- **TypeScript:** 5.7 (strict mode enabled)

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIRAITH IDE (Tauri 2.0)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │Kanban│  │ IDE  │  │Term. │  │Prev. │  │Galaxy│  │Stats │  │
│  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  │
│     └─────────┴─────────┴─────────┴─────────┴─────────┘       │
│                         │                                       │
│              ┌──────────▼──────────┐                           │
│              │  React 19 Frontend  │                           │
│              │   (Next.js 15.2)    │                           │
│              │  - Zustand (state)  │                           │
│              │  - TanStack Query   │                           │
│              │  - Tailwind CSS 4   │                           │
│              └──────────┬──────────┘                           │
│                         │                                       │
│              ┌──────────▼──────────┐                           │
│              │    IPC Bridge       │                           │
│              │  (Tauri Commands)   │                           │
│              │  - Type-safe        │                           │
│              │  - Async/streaming  │                           │
│              └──────────┬──────────┘                           │
│                         │                                       │
│  ┌──────────────────────▼─────────────────────────────────┐   │
│  │         Rust Backend (Main Process - src-tauri/)       │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │   │
│  │  │   File   │  │ Terminal │  │  Agent   │  │  Dev   │ │   │
│  │  │  System  │  │   PTY    │  │(PHASE 2) │  │ Server │ │   │
│  │  │(tokio fs)│  │(portable)│  │          │  │(BrowserView) │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │   │
│  │                                                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │   │
│  │  │    DB    │  │   Git    │  │  Search  │  │ Voice  │ │   │
│  │  │(rusqlite)│  │ (git2)   │  │(ripgrep) │  │(PHASE2)│ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Note: "PHASE 2" components are placeholders for now
```

---

## 5. Database Schema

### SQLite Schema (Complete)

```sql
-- Version control
CREATE TABLE schema_version (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO schema_version VALUES (1, strftime('%s', 'now'));

-- Projects
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  settings JSON DEFAULT '{}',
  CONSTRAINT valid_json CHECK (json_valid(settings))
);

-- Boards
CREATE TABLE boards (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Columns
CREATE TABLE columns (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  automation_rules JSON DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  CONSTRAINT valid_json CHECK (json_valid(automation_rules))
);

-- Cards
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  column_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  folder_path TEXT,
  file_paths JSON DEFAULT '[]',
  agent_config JSON DEFAULT '{}',
  position INTEGER NOT NULL,
  status TEXT CHECK(status IN ('idle', 'queued', 'executing', 'review', 'done', 'error')) DEFAULT 'idle',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  metadata JSON DEFAULT '{}',
  FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
  CONSTRAINT valid_json_files CHECK (json_valid(file_paths)),
  CONSTRAINT valid_json_config CHECK (json_valid(agent_config)),
  CONSTRAINT valid_json_metadata CHECK (json_valid(metadata))
);

-- Card Executions (for Phase 2 - AI execution tracking)
CREATE TABLE card_executions (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  started_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  completed_at INTEGER,
  status TEXT CHECK(status IN ('running', 'success', 'failed', 'cancelled')) DEFAULT 'running',
  agent_type TEXT NOT NULL,
  input_context JSON NOT NULL,
  output_result JSON,
  error_message TEXT,
  ghost_branch TEXT,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  CONSTRAINT valid_json_input CHECK (json_valid(input_context)),
  CONSTRAINT valid_json_output CHECK (json_valid(output_result))
);

-- Agent Logs (Phase 2)
CREATE TABLE agent_logs (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  level TEXT CHECK(level IN ('debug', 'info', 'warn', 'error')) DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSON DEFAULT '{}',
  FOREIGN KEY (execution_id) REFERENCES card_executions(id) ON DELETE CASCADE,
  CONSTRAINT valid_json CHECK (json_valid(metadata))
);

-- Agent Messages (Phase 2 - Swarm Communication)
CREATE TABLE agent_messages (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  message_type TEXT CHECK(message_type IN ('status', 'request', 'response', 'error')),
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (execution_id) REFERENCES card_executions(id) ON DELETE CASCADE
);

-- Gamification (Phase 2)
CREATE TABLE user_stats (
  id TEXT PRIMARY KEY,
  total_cards_completed INTEGER DEFAULT 0,
  total_lines_written INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges JSON DEFAULT '[]',
  last_activity INTEGER
);

-- Voice Transcriptions (Phase 2)
CREATE TABLE voice_transcriptions (
  id TEXT PRIMARY KEY,
  audio_path TEXT NOT NULL,
  transcription TEXT NOT NULL,
  confidence REAL,
  duration_ms INTEGER,
  created_cards JSON DEFAULT '[]',
  timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Indexes
CREATE INDEX idx_cards_column ON cards(column_id);
CREATE INDEX idx_cards_status ON cards(status);
CREATE INDEX idx_cards_updated ON cards(updated_at DESC);
CREATE INDEX idx_executions_card ON card_executions(card_id);
CREATE INDEX idx_executions_status ON card_executions(status);
CREATE INDEX idx_logs_execution ON agent_logs(execution_id);
CREATE INDEX idx_logs_timestamp ON agent_logs(timestamp DESC);
CREATE INDEX idx_messages_execution ON agent_messages(execution_id);

-- Triggers (auto-update timestamps)
CREATE TRIGGER update_project_timestamp 
AFTER UPDATE ON projects
BEGIN
  UPDATE projects SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_card_timestamp 
AFTER UPDATE ON cards
BEGIN
  UPDATE cards SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;
```

---

## 6. Feature 1: Kanban Board (✅ PHASE 1)

### Overview
Visual task management where cards are executable agents.

### UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  VIRAITH IDE - Project: MyApp                       [⚙️ ◐ ✕] │
├─────────────────────────────────────────────────────────────┤
│  To-Do          │  Agent Working  │  Review        │  Done  │
├─────────────────┼─────────────────┼────────────────┼────────┤
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌────────────┐ │ ┌────┐│
│ │ Add Login   │ │ │ Dark Mode   │ │ │ API Auth   │ │ │... ││
│ │             │ │ │ [🤖 Working]│ │ │ [👁 Review]│ │ └────┘│
│ │ 📁/src/auth │ │ │ ⚡ 45% done │ │ │            │ │       │
│ │ [☁️ Execute]│ │ └─────────────┘ │ └────────────┘ │       │
│ └─────────────┘ │                 │                │       │
└─────────────────┴─────────────────┴────────────────┴───────┘
```

### Component Structure (TypeScript)

```typescript
// src/components/kanban/Board.tsx
'use client';

import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { Column } from './Column';
import { Card } from './Card';
import { useBoardStore } from '@/store/boardStore';

export function Board({ boardId }: { boardId: string }) {
  const { columns, cards, moveCard } = useBoardStore();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    await moveCard(active.id as string, over.id as string);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 h-full p-4 bg-black">
        {columns.map((column) => (
          <SortableContext key={column.id} items={column.cardIds}>
            <Column column={column}>
              {cards
                .filter((card) => column.cardIds.includes(card.id))
                .map((card) => (
                  <Card key={card.id} card={card} />
                ))}
            </Column>
          </SortableContext>
        ))}
      </div>
    </DndContext>
  );
}
```

```typescript
// src/components/kanban/Card.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { Folder, Play } from 'lucide-react';

interface CardProps {
  card: {
    id: string;
    title: string;
    description?: string;
    folderPath?: string;
    status: 'idle' | 'executing' | 'review' | 'done';
  };
}

export function Card({ card }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleExecute = async () => {
    // Phase 1: Just show a placeholder
    await invoke('execute_card_placeholder', { cardId: card.id });
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={cn(
          'border border-gray-800 bg-black/50 backdrop-blur p-4 rounded',
          card.status === 'executing' && 'ring-2 ring-amber-500'
        )}
      >
        <h3 className="font-mono text-sm text-white">{card.title}</h3>

        {card.description && (
          <p className="text-xs text-gray-400 mt-2">{card.description}</p>
        )}

        {card.folderPath && (
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <Folder className="w-3 h-3" />
            <span className="font-mono">{card.folderPath}</span>
          </div>
        )}

        {card.status === 'idle' && (
          <button
            onClick={handleExecute}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded text-xs font-mono"
          >
            <Play className="w-3 h-3" />
            Execute (Coming Soon)
          </button>
        )}

        {card.status === 'executing' && (
          <div className="mt-3 text-xs text-amber-400 font-mono animate-pulse">
            🤖 Agent working... (Placeholder)
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

### Backend (Rust) - Phase 1 Placeholder

```rust
// src-tauri/src/commands/card.rs
use crate::database::Database;

#[tauri::command]
pub async fn execute_card_placeholder(
    card_id: String,
    db: tauri::State<'_, Database>,
) -> Result<String, String> {
    // Phase 1: Just update the status to show it was clicked
    db.update_card_status(&card_id, "executing").await?;

    // Simulate work
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

    // Update to review status
    db.update_card_status(&card_id, "review").await?;

    Ok("Card executed (placeholder - AI integration coming in Phase 2)".to_string())
}

// Phase 2: This will be replaced with:
// #[tauri::command]
// pub async fn execute_card(
//     card_id: String,
//     db: tauri::State<'_, Database>,
//     agent: tauri::State<'_, AgentOrchestrator>, // Added in Phase 2
// ) -> Result<String, String> {
//     // Real agent execution logic here
// }
```

---

## 7. Feature 2: Folder Context (✅ PHASE 1)

### Drag & Drop Implementation

```typescript
// src/components/kanban/Card.tsx (extended)
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function Card({ card }: CardProps) {
  const [isDraggingFolder, setIsDraggingFolder] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFolder(false);

    // Get folder path from system
    const folderPath = await invoke<string>('get_dropped_folder_path', {
      x: e.clientX,
      y: e.clientY,
    });

    if (folderPath) {
      await invoke('attach_folder_to_card', {
        cardId: card.id,
        folderPath,
      });
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFolder(true);
      }}
      onDragLeave={() => setIsDraggingFolder(false)}
      onDrop={handleDrop}
      className={cn(
        'card',
        isDraggingFolder && 'ring-2 ring-blue-500'
      )}
    >
      {/* Card content */}
    </div>
  );
}
```

### File Watcher (Rust)

```rust
// src-tauri/src/watchers/file_watcher.rs
use notify::{Watcher, RecursiveMode, Event};
use std::sync::mpsc::channel;
use std::path::Path;
use tauri::Window;
use std::collections::HashMap;

pub struct FileWatcher {
    watchers: HashMap<String, notify::RecommendedWatcher>,
}

impl FileWatcher {
    pub fn new() -> Self {
        Self {
            watchers: HashMap::new(),
        }
    }

    pub fn watch_folder(&mut self, card_id: &str, path: &str, window: Window) -> Result<(), String> {
        let (tx, rx) = channel();
        let window_clone = window.clone();
        let card_id = card_id.to_string();

        let mut watcher = notify::recommended_watcher(move |res: Result<Event, _>| {
            match res {
                Ok(event) => {
                    let _ = window_clone.emit("file-change", serde_json::json!({
                        "cardId": card_id,
                        "event": format!("{:?}", event.kind),
                        "paths": event.paths,
                    }));
                }
                Err(e) => eprintln!("Watch error: {:?}", e),
            }
        }).map_err(|e| e.to_string())?;

        watcher.watch(Path::new(path), RecursiveMode::Recursive)
            .map_err(|e| e.to_string())?;

        self.watchers.insert(card_id.to_string(), watcher);
        Ok(())
    }
}
```

---

## 8. Feature 3: Multi-Agent Swarm (⚠️ PHASE 2 - SKIP FOR NOW)

**Agent Instructions:** Do NOT implement this section yet. Leave placeholder comments.

### Placeholder Code

```rust
// src-tauri/src/agent/mod.rs
// TODO (Phase 2): Implement LangGraph-based agent orchestration
// This will require:
// - Claude API integration
// - Multi-agent coordination logic
// - Prompt templates
// - Error handling for LLM failures

pub struct AgentOrchestrator {
    // Placeholder - will be implemented in Phase 2
}

impl AgentOrchestrator {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn execute_card(
        &self,
        card_id: &str,
        task: &str,
        folder_path: &str,
    ) -> Result<String, String> {
        // Phase 2: Real implementation
        // For now, return placeholder
        Ok("Agent execution will be implemented in Phase 2".to_string())
    }
}
```

---

## 9. Feature 4: Voice Director (⚠️ PHASE 2 - SKIP FOR NOW)

**Agent Instructions:** Do NOT implement Whisper integration yet.

### Placeholder Code

```rust
// src-tauri/src/voice/mod.rs
// TODO (Phase 2): Integrate Whisper voice recognition
// Dependencies needed:
// - whisper-rs = "0.12"
// - Audio capture library
// - WAV processing

pub struct VoiceHandler {
    // Placeholder
}

impl VoiceHandler {
    pub fn new() -> Result<Self, String> {
        Ok(Self {})
    }

    pub async fn transcribe_file(&self, _audio_path: &str) -> Result<String, String> {
        // Phase 2: Real Whisper implementation
        Err("Voice recognition will be added in Phase 2".to_string())
    }
}
```

---

## 10. Feature 5: Clarifier Agent (⚠️ PHASE 2 - SKIP FOR NOW)

**Placeholder only - no implementation needed yet.**

---

## 11. Feature 6: Ghost Mode (✅ PHASE 1)

### Git Branch Management

```rust
// src-tauri/src/ghost/mod.rs
use git2::{Repository, BranchType, Signature};
use std::path::Path;

pub struct GhostMode {
    repo: Repository,
}

impl GhostMode {
    pub fn new(repo_path: &str) -> Result<Self, String> {
        let repo = Repository::open(repo_path)
            .map_err(|e| format!("Failed to open git repo: {}", e))?;

        Ok(Self { repo })
    }

    pub fn create_ghost_branch(&self, card_id: &str) -> Result<String, String> {
        let head = self.repo.head()
            .map_err(|e| e.to_string())?;

        let commit = head.peel_to_commit()
            .map_err(|e| e.to_string())?;

        let branch_name = format!("ghost/{}/{}", card_id, chrono::Utc::now().timestamp());

        self.repo.branch(&branch_name, &commit, false)
            .map_err(|e| e.to_string())?;

        // Checkout the ghost branch
        let obj = self.repo.revparse_single(&branch_name)
            .map_err(|e| e.to_string())?;

        self.repo.checkout_tree(&obj, None)
            .map_err(|e| e.to_string())?;

        self.repo.set_head(&format!("refs/heads/{}", branch_name))
            .map_err(|e| e.to_string())?;

        Ok(branch_name)
    }

    pub fn merge_to_main(&self, ghost_branch: &str) -> Result<(), String> {
        // Checkout main
        let main = self.repo.revparse_single("main")
            .map_err(|e| e.to_string())?;

        self.repo.checkout_tree(&main, None)
            .map_err(|e| e.to_string())?;

        self.repo.set_head("refs/heads/main")
            .map_err(|e| e.to_string())?;

        // Merge ghost branch
        let ghost_commit = self.repo.revparse_single(ghost_branch)
            .map_err(|e| e.to_string())?
            .peel_to_commit()
            .map_err(|e| e.to_string())?;

        let head_commit = self.repo.head()
            .map_err(|e| e.to_string())?
            .peel_to_commit()
            .map_err(|e| e.to_string())?;

        let mut index = self.repo.merge_commits(&head_commit, &ghost_commit, None)
            .map_err(|e| e.to_string())?;

        if index.has_conflicts() {
            return Err("Merge conflicts detected - resolve manually".to_string());
        }

        // Create merge commit
        let tree_id = index.write_tree_to(&self.repo)
            .map_err(|e| e.to_string())?;
        let tree = self.repo.find_tree(tree_id)
            .map_err(|e| e.to_string())?;

        let signature = Signature::now("VIRAITH User", "user@VIRAITH.dev")
            .map_err(|e| e.to_string())?;

        self.repo.commit(
            Some("HEAD"),
            &signature,
            &signature,
            &format!("[VIRAITH] Merge ghost branch {}", ghost_branch),
            &tree,
            &[&head_commit, &ghost_commit],
        ).map_err(|e| e.to_string())?;

        // Delete ghost branch
        let mut branch = self.repo.find_branch(ghost_branch, BranchType::Local)
            .map_err(|e| e.to_string())?;
        branch.delete().map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn get_diff(&self, branch1: &str, branch2: &str) -> Result<String, String> {
        let tree1 = self.repo.revparse_single(branch1)
            .map_err(|e| e.to_string())?
            .peel_to_tree()
            .map_err(|e| e.to_string())?;

        let tree2 = self.repo.revparse_single(branch2)
            .map_err(|e| e.to_string())?
            .peel_to_tree()
            .map_err(|e| e.to_string())?;

        let diff = self.repo.diff_tree_to_tree(Some(&tree1), Some(&tree2), None)
            .map_err(|e| e.to_string())?;

        let mut diff_text = String::new();
        diff.print(git2::DiffFormat::Patch, |_delta, _hunk, line| {
            diff_text.push_str(&String::from_utf8_lossy(line.content()));
            true
        }).map_err(|e| e.to_string())?;

        Ok(diff_text)
    }
}
```

---

## 12. Feature 7: Time Machine (✅ PHASE 1)

### Simple Timeline View

```typescript
// src/components/time-machine/Timeline.tsx
'use client';

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Commit {
  sha: string;
  message: string;
  timestamp: number;
}

export function TimeMachine({ cardId }: { cardId: string }) {
  const [commits, setCommits] = useState<Commit[]>([]);

  useEffect(() => {
    loadCommits();
  }, [cardId]);

  const loadCommits = async () => {
    const history = await invoke<Commit[]>('get_branch_commits', { 
      branchPrefix: `ghost/${cardId}` 
    });
    setCommits(history);
  };

  const jumpToCommit = async (sha: string) => {
    await invoke('checkout_commit', { commitSha: sha });
  };

  return (
    <div className="p-4 bg-black border border-gray-800 rounded">
      <h3 className="font-mono text-sm text-white mb-4">⏱️ Time Machine</h3>

      <div className="space-y-2">
        {commits.map((commit) => (
          <div
            key={commit.sha}
            onClick={() => jumpToCommit(commit.sha)}
            className="text-xs font-mono p-2 border border-gray-800 hover:border-amber-500 cursor-pointer"
          >
            <span className="text-gray-400">
              {new Date(commit.timestamp * 1000).toLocaleString()}
            </span>
            <p className="text-white mt-1">{commit.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 13. Feature 8: Hive Mind (⚠️ PHASE 2 - SKIP)

Placeholder only.

---

## 14. Feature 9: Live Preview (✅ PHASE 1)

### BrowserView Integration

```rust
// src-tauri/src/commands/preview.rs
use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
pub async fn start_preview_server(
    project_path: String,
    app: AppHandle,
) -> Result<String, String> {
    // Start dev server (e.g., npm run dev)
    let port = 3000;

    let mut cmd = tokio::process::Command::new("npm");
    cmd.args(&["run", "dev"])
        .current_dir(&project_path)
        .spawn()
        .map_err(|e| e.to_string())?;

    // Wait a bit for server to start
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

    // Create preview window
    WebviewWindowBuilder::new(
        &app,
        "preview",
        WebviewUrl::External(format!("http://localhost:{}", port).parse().unwrap())
    )
    .title("Live Preview")
    .inner_size(1200.0, 800.0)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(format!("http://localhost:{}", port))
}
```

---

## 15. Feature 10: Vibe Terminal (✅ PHASE 1 - Basic, Phase 2 - NLP)

### Phase 1: Basic Terminal

```rust
// src-tauri/src/terminal/mod.rs
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

pub struct VibeTerminal {
    current_dir: String,
    history: Vec<String>,
}

impl VibeTerminal {
    pub fn new(working_dir: &str) -> Result<Self, String> {
        Ok(Self {
            current_dir: working_dir.to_string(),
            history: Vec::new(),
        })
    }

    pub fn get_shell() -> String {
        std::env::var("SHELL").unwrap_or_else(|_| {
            if cfg!(windows) { "powershell.exe".to_string() }
            else { "zsh".to_string() }
        })
    }

    pub fn add_to_history(&mut self, cmd: &str) {
        self.history.push(cmd.to_string());
    }

    pub fn get_suggestions(&self) -> Vec<String> {
        // Simple frequency-based suggestions
        let mut suggestions = vec!["npm run dev", "git status", "npm test"];
        suggestions.into_iter().map(|s| s.to_string()).collect()
    }
}

// TODO (Phase 2): Add natural language parsing
// pub async fn parse_natural_command(&self, input: &str) -> Result<String, String> {
//     // Will use Claude API to convert natural language to shell commands
// }
```

### Frontend Terminal Component

```typescript
// src/components/terminal/VibeTerminal.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { invoke } from '@tauri-apps/api/core';
import '@xterm/xterm/css/xterm.css';

export function VibeTerminal({ projectPath }: { projectPath: string }) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#000000',
        foreground: '#e0e0e0',
        cursor: '#d4a574',
      },
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 14,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    // Phase 1: Basic terminal
    // Phase 2: Add natural language mode (Alt+N)

    return () => {
      term.dispose();
    };
  }, [projectPath]);

  return (
    <div className="relative h-full w-full bg-black">
      <div ref={terminalRef} className="h-full w-full p-4" />

      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gray-900 border-t border-gray-800 text-xs text-gray-400 px-4 flex items-center">
        <span>{projectPath}</span>
        <span className="ml-auto">Ctrl+L: Clear | Ctrl+P: Find Files</span>
      </div>
    </div>
  );
}
```

---

## 16. Feature 11: Galaxy View (✅ PHASE 1 - Simple Tree)

### Simple File Tree (Phase 1)

```typescript
// src/components/galaxy/FileTree.tsx
'use client';

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export function FileTree({ projectPath }: { projectPath: string }) {
  const [tree, setTree] = useState<FileNode | null>(null);

  useEffect(() => {
    loadTree();
  }, [projectPath]);

  const loadTree = async () => {
    const structure = await invoke<FileNode>('get_file_tree', { projectPath });
    setTree(structure);
  };

  const renderNode = (node: FileNode, depth: number = 0) => (
    <div key={node.path} style={{ paddingLeft: `${depth * 16}px` }}>
      <div className="flex items-center gap-2 py-1 hover:bg-gray-900 cursor-pointer">
        {node.isDirectory ? (
          <>
            <ChevronRight className="w-4 h-4 text-gray-500" />
            <Folder className="w-4 h-4 text-amber-500" />
          </>
        ) : (
          <File className="w-4 h-4 text-gray-400 ml-4" />
        )}
        <span className="text-sm font-mono text-white">{node.name}</span>
      </div>
      {node.children?.map((child) => renderNode(child, depth + 1))}
    </div>
  );

  return (
    <div className="h-full bg-black p-4 overflow-y-auto">
      <h3 className="text-white font-mono mb-4">📁 Project Files</h3>
      {tree && renderNode(tree)}
    </div>
  );
}
```

---

## 17. Feature 12: Gamification (⚠️ PHASE 2 - SKIP)

Placeholder only - XP calculations will be added later.

---

## 18. Feature 13: Signal Feed (✅ PHASE 1)

### Real-time Event Log

```typescript
// src/components/signal/SignalFeed.tsx
'use client';

import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

interface SignalEvent {
  source: string;
  message: string;
  timestamp: number;
  type: 'success' | 'warning' | 'info' | 'error';
}

export function SignalFeed() {
  const [events, setEvents] = useState<SignalEvent[]>([]);

  useEffect(() => {
    const unlisten = listen<SignalEvent>('system-event', (event) => {
      setEvents((prev) => [event.payload, ...prev].slice(0, 100));
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <div className="h-full bg-black p-4 font-mono text-xs overflow-y-auto">
      <h3 className="text-white mb-4">📡 Signal Feed</h3>

      <div className="space-y-2">
        {events.map((event, i) => (
          <div key={i} className="flex gap-2 text-gray-400">
            <span className="text-gray-600">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
            <span className={cn(
              event.type === 'success' && 'text-green-400',
              event.type === 'error' && 'text-red-400',
              event.type === 'warning' && 'text-yellow-400',
              event.type === 'info' && 'text-cyan-400',
            )}>
              [{event.source}]
            </span>
            <span>{event.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 19. UI/UX Design

### Terminal Brutalism Theme

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-ghost: oklch(0.5 0.2 250);
  --color-amber: #d4a574;
  --color-success: #6b8e6f;
  --color-error: #8b4f4f;

  --font-mono: 'JetBrains Mono', monospace;
}

@layer base {
  body {
    @apply bg-black text-white font-mono;
  }
}

@layer utilities {
  .terminal-border {
    @apply border border-gray-800/50 shadow-[0_0_20px_rgba(0,0,0,0.5)];
  }

  .card-glow {
    @apply shadow-[0_0_30px_rgba(212,165,116,0.3)];
  }
}
```

---

## 20. Security

### Tauri Security Model

```json
// tauri.conf.json
{
  "tauri": {
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      "dangerousRemoteDomainIpcAccess": [],
      "assetProtocol": {
        "enable": true,
        "scope": ["$RESOURCE/**"]
      }
    },
    "allowlist": {
      "fs": {
        "scope": ["$APPDATA/**", "$RESOURCE/**", "$HOME/**"]
      },
      "shell": {
        "open": true,
        "scope": [
          { "name": "npm", "cmd": "npm", "args": true },
          { "name": "git", "cmd": "git", "args": true },
          { "name": "node", "cmd": "node", "args": true }
        ]
      }
    }
  }
}
```

---

## 21. Testing

### E2E Test Example

```typescript
// e2e/basic-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('user can create and move cards', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Create card
  await page.click('[data-testid="add-card-button"]');
  await page.fill('[data-testid="card-title-input"]', 'Test Card');
  await page.click('[data-testid="save-card-button"]');

  // Verify card appears
  await expect(page.locator('text=Test Card')).toBeVisible();

  // Drag to different column
  await page.dragAndDrop(
    '[data-card-id="test-card"]',
    '[data-column-id="in-progress"]'
  );

  // Verify moved
  const column = page.locator('[data-column-id="in-progress"]');
  await expect(column.locator('text=Test Card')).toBeVisible();
});
```

---

## 22. Performance Targets

| Operation | Target | Maximum |
|:---|:---|:---|
| App startup | <500ms | <1s |
| Card drag | <16ms | <33ms |
| File tree load (1000 files) | <200ms | <500ms |
| Git branch create | <100ms | <300ms |
| Terminal command | <50ms | <100ms |

---

## 23. Deployment

### Build Command

```bash
# Install dependencies
pnpm install

# Build for production
pnpm tauri build

# Output locations:
# - macOS: src-tauri/target/release/bundle/dmg/
# - Windows: src-tauri/target/release/bundle/msi/
# - Linux: src-tauri/target/release/bundle/appimage/
```

---

## 📊 Phase 1 Checklist (Immediate Implementation)

✅ **Must Build:**
- [ ] Tauri app shell
- [ ] SQLite database with schema
- [ ] Kanban board (drag-drop)
- [ ] Card CRUD operations
- [ ] Folder picker and attachment
- [ ] Basic terminal (xterm.js)
- [ ] Git integration (create branches, merge)
- [ ] File watcher
- [ ] Live preview window
- [ ] Signal feed (event log)
- [ ] Basic UI/UX

❌ **Skip for Now (Phase 2):**
- Agent AI execution
- Voice recognition
- Natural language parsing
- Gamification calculations
- Advanced analytics

---

## 🚀 Getting Started (For The Agent)

1. Initialize Tauri project:
```bash
npm create tauri-app@latest VIRAITH-ide
cd VIRAITH-ide
```

2. Add dependencies (from section 3)

3. Create database schema (from section 5)

4. Build Kanban board UI (from section 6)

5. Add Git integration (from section 11)

6. Add terminal (from section 15)

7. Add live preview (from section 14)

**When Phase 1 is complete, we'll add AI features together in Phase 2.**

---

**This document contains EVERYTHING needed to build VIRAITH IDE Phase 1.**

*Document Version: 3.0.0 - Master Specification with Phase Separation*  
*Created: January 18, 2026*  
*Phase 1 Build Time: 4-6 weeks*  
*Phase 2 Build Time: 4-6 weeks (with user collaboration)*
