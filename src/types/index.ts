// Core types for VIRAITH IDE

export interface Project {
  id: string;
  name: string;
  rootPath: string;
  createdAt: number;
  updatedAt: number;
  settings: ProjectSettings;
}

export interface ProjectSettings {
  defaultBoardId?: string;
  theme?: 'dark' | 'light';
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  position: number;
  createdAt: number;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number;
  automationRules: AutomationRule[];
  createdAt: number;
}

export interface AutomationRule {
  trigger: 'on_enter' | 'on_exit';
  action: 'execute' | 'notify' | 'move';
  config: Record<string, unknown>;
}

export interface Card {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  folderPath?: string;
  filePaths: string[];
  agentConfig: AgentConfig;
  position: number;
  status: CardStatus;
  createdAt: number;
  updatedAt: number;
  metadata: CardMetadata;
}

export type CardStatus =
  | 'idle'
  | 'queued'
  | 'executing'
  | 'review'
  | 'done'
  | 'error';

export interface AgentConfig {
  type?: AgentType;
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
}

export type AgentType =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'testing'
  | 'devops'
  | 'general';

export interface CardMetadata {
  ghostBranch?: string;
  lastExecutionId?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  lastAgentResponse?: string;
  lastAgentError?: string;
  lastAgentTimestamp?: number;
  attachedSkillIds?: string[];
}

export interface CardExecution {
  id: string;
  cardId: string;
  startedAt: number;
  completedAt?: number;
  status: ExecutionStatus;
  agentType: string;
  inputContext: Record<string, unknown>;
  outputResult?: Record<string, unknown>;
  errorMessage?: string;
  ghostBranch?: string;
}

export type ExecutionStatus = 'running' | 'success' | 'failed' | 'cancelled';

export interface AgentLog {
  id: string;
  executionId: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata: Record<string, unknown>;
}

// Extended execution type for timeline with more details
export interface TimelineExecution extends CardExecution {
  cardTitle: string;
  cardDescription?: string;
  model: string;
  skillsUsed: string[];
  filesCreated: string[];
  filesModified: string[];
  promptUsed: string;
  responseText: string;
  duration?: number; // in milliseconds
}

// File change tracking for diff viewer
export interface FileChange {
  path: string;
  type: 'created' | 'modified' | 'deleted';
  beforeContent?: string;
  afterContent?: string;
}

export interface SignalEvent {
  source: string;
  message: string;
  timestamp: number;
  type: 'success' | 'warning' | 'info' | 'error';
}

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  size?: number;
  modified?: number;
}

export interface GitBranch {
  name: string;
  isHead: boolean;
  isGhost: boolean;
  lastCommit?: string;
}

export interface GitCommit {
  sha: string;
  message: string;
  timestamp: number;
  author: string;
}

// Skills types for agent capabilities
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  content: string; // Markdown content of the skill
  tags: string[];
  isBuiltIn: boolean;
  createdAt: number;
  updatedAt: number;
}

export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'testing'
  | 'devops'
  | 'design'
  | 'documentation'
  | 'general';

// Built-in skills that come with the IDE
export interface BuiltInSkill {
  name: string;
  description: string;
  category: SkillCategory;
  content: string;
  tags: string[];
}
