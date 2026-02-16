// Local Agent Implementation for VIRAITH IDE
// Connects to Ollama or other local LLM providers

export interface LocalAgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
}

export interface LocalAgentResponse {
  content: string;
  toolCalls?: ToolCall[];
  error?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  handler: (args: Record<string, any>) => Promise<string>;
}

type LocalProvider = 'ollama' | 'lm-studio' | 'custom';

class LocalAgent {
  private provider: LocalProvider = 'ollama';
  private baseUrl: string = 'http://localhost:11434'; // Ollama default
  private model: string = 'qwen2.5-coder:7b-instruct-q8_0';
  private tools: Map<string, Tool> = new Map();
  private conversationHistory: LocalAgentMessage[] = [];

  constructor() {
    this.setupDefaultTools();
  }

  // Configure the local provider
  configure(config: {
    provider?: LocalProvider;
    baseUrl?: string;
    model?: string;
  }) {
    if (config.provider) this.provider = config.provider;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.model) this.model = config.model;

    // Set default URLs based on provider
    if (config.provider === 'ollama') {
      this.baseUrl = 'http://localhost:11434';
    } else if (config.provider === 'lm-studio') {
      this.baseUrl = 'http://localhost:1234';
    }
  }

  // Register a tool for the agent to use
  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  // Unregister a tool
  unregisterTool(name: string) {
    this.tools.delete(name);
  }

  // Get all registered tools
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Get conversation history
  getHistory(): LocalAgentMessage[] {
    return this.conversationHistory;
  }

  // Check if local agent is available
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get available models (Ollama)
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];

      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }

  // Generate system prompt with available tools
  private generateSystemPrompt(): string {
    const toolDescriptions = Array.from(this.tools.values())
      .map(tool => `- ${tool.name}: ${tool.description}`)
      .join('\n');

    return `You are VIRAITH, a local AI coding assistant integrated into an IDE.

## About VIRAITH IDE

VIRAITH IDE is an AI-powered development environment with:
- **Kanban Board**: Manage tasks with columns (To Do, In Progress, Review, Done)
- **File Explorer**: Browse and manage project files
- **Code Editor**: Edit files with syntax highlighting
- **AI Agent**: Execute tasks automatically (can create, read, and write files)
- **Skills System**: Attach specialized skills to cards for enhanced AI capabilities
- **Ghost Branches**: Experimental git branches for isolated work

## Your Capabilities

You help developers by:
- Creating and managing to-do cards on the kanban board
- Breaking down large tasks into smaller, actionable cards
- Analyzing project structure and files
- Suggesting improvements and automations
- Understanding codebases through documentation scanning

## Available Tools

${toolDescriptions}

You have card management tools:
- **create_card**: Create new to-do cards
- **list_cards**: See all existing cards
- **delete_card**: Delete a specific card by title
- **delete_all_cards_in_column**: Delete all cards in a column (e.g., "To Do")
- **scan_project**: View the file structure
- **read_file**: Read any file in the project
- **read_documentation**: Read README.md and other docs

## Tool Usage Format

When you need to use a tool, respond with:
\`\`\`tool
{"name": "tool_name", "arguments": {"param": "value"}}
\`\`\`

You can use multiple tools in one response.

## Guidelines

1. **Be concise and practical** - users want actionable advice
2. **When creating cards**, use descriptive titles and add detailed descriptions
3. **Break down large tasks** into smaller, manageable pieces (3-5 cards ideally)
4. **Scan the project** before suggesting changes to understand context
5. **Read documentation** (README.md, docs folder) to understand the project better
6. **Always explain** what you're doing and why
7. **If unsure**, ask for clarification or scan the project first

## Project Context

The user has a kanban board with these columns:
- **To Do**: Tasks to be started
- **In Progress**: Currently active tasks
- **Review**: Tasks ready for review
- **Done**: Completed tasks

Cards can have:
- Title and description
- Attached folder paths for context
- Skills for specialized AI capabilities
- Agent responses after execution

## Best Practices

- When asked to "create X", break it down into 3-5 specific tasks
- Each card should have a clear, actionable title
- Add descriptions that explain what needs to be done
- Use the "scan_project" tool to understand the codebase first
- Use the "read_file" tool to see existing code before suggesting changes
- Consider the project's tech stack when suggesting solutions`;
  }

  // Parse tool calls from response
  private parseToolCalls(content: string): { content: string; toolCalls: ToolCall[] } {
    const toolCalls: ToolCall[] = [];
    let cleanedContent = content;

    // Match ```tool blocks
    const toolRegex = /```tool\s*\n([\s\S]*?)```/g;
    let match;

    while ((match = toolRegex.exec(content)) !== null) {
      const blockContent = match[1];

      // Try to parse as single JSON first
      try {
        const toolCall = JSON.parse(blockContent);
        toolCalls.push({
          id: `call_${Date.now()}_${toolCalls.length}`,
          name: toolCall.name,
          arguments: toolCall.arguments || toolCall.params || {},
        });
        cleanedContent = cleanedContent.replace(match[0], '').trim();
      } catch {
        // If single JSON fails, try parsing multiple JSON objects (one per line)
        try {
          const lines = blockContent.trim().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              const toolCall = JSON.parse(line);
              toolCalls.push({
                id: `call_${Date.now()}_${toolCalls.length}`,
                name: toolCall.name,
                arguments: toolCall.arguments || toolCall.params || {},
              });
            }
          }
          cleanedContent = cleanedContent.replace(match[0], '').trim();
        } catch (e) {
          console.error('Failed to parse tool call block:', blockContent, e);
        }
      }
    }

    return { content: cleanedContent, toolCalls };
  }

  // Execute a tool call
  private async executeToolCall(toolCall: ToolCall): Promise<string> {
    const tool = this.tools.get(toolCall.name);
    if (!tool) {
      return `Error: Unknown tool "${toolCall.name}"`;
    }

    try {
      const result = await tool.handler(toolCall.arguments);
      return result;
    } catch (error) {
      return `Error executing ${toolCall.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Chat with the local agent
  async chat(
    userMessage: string,
    options?: {
      systemPrompt?: string;
      context?: {
        projectPath?: string;
        fileTree?: any;
        currentCards?: any[];
      };
    }
  ): Promise<LocalAgentResponse> {
    try {
      // Build messages
      const messages: LocalAgentMessage[] = [
        {
          role: 'system',
          content: options?.systemPrompt || this.generateSystemPrompt(),
        },
      ];

      // Add context if available
      if (options?.context) {
        const contextParts: string[] = [];
        if (options.context.projectPath) {
          contextParts.push(`Project path: ${options.context.projectPath}`);
        }
        if (options.context.currentCards) {
          contextParts.push(`Current cards (${options.context.currentCards.length}): ${options.context.currentCards.map((c: any) => c.title).join(', ')}`);
        }
        if (contextParts.length > 0) {
          messages.push({
            role: 'user',
            content: `## Current Context\n\n${contextParts.join('\n')}`,
          });
        }
      }

      // Add conversation history
      messages.push(...this.conversationHistory);

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Call the local API
      let response: Response;

      if (this.provider === 'ollama') {
        response = await fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            messages: messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            stream: false,
          }),
        });
      } else {
        // LM Studio / OpenAI-compatible format
        response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            messages: messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            temperature: 0.7,
          }),
        });
      }

      if (!response.ok) {
        return {
          content: '',
          error: `API error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      let content = '';

      if (this.provider === 'ollama') {
        content = data.message?.content || '';
      } else {
        content = data.choices?.[0]?.message?.content || '';
      }

      // Parse tool calls from response
      const { content: cleanedContent, toolCalls } = this.parseToolCalls(content);

      // Execute tool calls
      const toolResults: string[] = [];
      for (const toolCall of toolCalls) {
        const result = await this.executeToolCall(toolCall);
        toolResults.push(`${toolCall.name}: ${result}`);
      }

      // Update conversation history
      this.conversationHistory.push({ role: 'user', content: userMessage });
      this.conversationHistory.push({ role: 'assistant', content: cleanedContent });

      // If tools were executed, add results and get a follow-up response
      let finalContent = cleanedContent;
      if (toolCalls.length > 0) {
        const toolResultsText = toolResults.join('\n\n');
        finalContent += `\n\n**Actions taken:**\n${toolResultsText}`;
      }

      return {
        content: finalContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } catch (error) {
      return {
        content: '',
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Setup default tools
  private setupDefaultTools() {
    // This will be populated after we have access to the stores
    // The tools will be registered from the component
  }
}

// Singleton instance
export const localAgent = new LocalAgent();

// Helper to configure the agent
export function configureLocalAgent(config: {
  provider?: LocalProvider;
  baseUrl?: string;
  model?: string;
}) {
  localAgent.configure(config);
}

// Helper to check availability
export async function isLocalAgentAvailable(): Promise<boolean> {
  return localAgent.isAvailable();
}

// Helper to get available models
export async function getAvailableModels(): Promise<string[]> {
  return localAgent.getAvailableModels();
}
