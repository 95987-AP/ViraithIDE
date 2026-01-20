pub const SCHEMA: &str = r#"
-- Version control
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO schema_version VALUES (1, strftime('%s', 'now'));

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  settings JSON DEFAULT '{}'
);

-- Boards
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Columns
CREATE TABLE IF NOT EXISTS columns (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  automation_rules JSON DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Cards
CREATE TABLE IF NOT EXISTS cards (
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
  FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
);

-- Card Executions (for Phase 2 - AI execution tracking)
CREATE TABLE IF NOT EXISTS card_executions (
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
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Agent Logs (Phase 2)
CREATE TABLE IF NOT EXISTS agent_logs (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  level TEXT CHECK(level IN ('debug', 'info', 'warn', 'error')) DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSON DEFAULT '{}',
  FOREIGN KEY (execution_id) REFERENCES card_executions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cards_column ON cards(column_id);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_updated ON cards(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_card ON card_executions(card_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON card_executions(status);
CREATE INDEX IF NOT EXISTS idx_logs_execution ON agent_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON agent_logs(timestamp DESC);

-- Triggers (auto-update timestamps)
CREATE TRIGGER IF NOT EXISTS update_project_timestamp
AFTER UPDATE ON projects
BEGIN
  UPDATE projects SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_card_timestamp
AFTER UPDATE ON cards
BEGIN
  UPDATE cards SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;
"#;
