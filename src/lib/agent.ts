// GLM 4.7 Agent Integration
// This module handles AI agent interactions for card execution
// Supports: Z.ai (direct), OpenRouter (with GLM-4.7, DeepSeek, etc.)

import { fileApi, isTauri } from './tauri';
import { useFileStore } from '@/store/fileStore';

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  success: boolean;
  content: string;
  error?: string;
  filesCreated?: string[];
  filesModified?: string[];
}

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface FileOperation {
  type: 'create' | 'modify' | 'delete';
  path: string;
  content?: string;
}

type Provider = 'zai' | 'openrouter';

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Circuit breaker state
interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 60000, // 1 minute
  backoffMultiplier: 2,
};

const DEFAULT_SYSTEM_PROMPT = `You are VIRAITH, an AI coding assistant integrated into an IDE.
You help developers by:
- Writing clean, efficient code
- Explaining complex concepts
- Debugging issues
- Suggesting improvements

=== CRITICAL: FILE OPERATION FORMAT ===

You MUST ALWAYS use the following special format for code blocks:

\`\`\`file:path/to/file.ext
Your file content here
\`\`\`

DO NOT use regular markdown code blocks like \`\`\`html or \`\`\`javascript.
ONLY use the \`\`\`file:filename.ext\`\`\` format.

CORRECT:
\`\`\`file:index.html
<!DOCTYPE html>
<html><body>Hello</body></html>
\`\`\`

INCORRECT (will NOT create files):
\`\`\`html
<!DOCTYPE html>
<html><body>Hello</body></html>
\`\`\`

=== EXAMPLES ===

For creating a new file:
\`\`\`file:src/index.js
function main() {
  console.log('Hello World');
}
export { main };
\`\`\`

For multiple files:
\`\`\`file:styles.css
body { margin: 0; background: #000; }
\`\`\`

\`\`\`file:index.html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <script type="module" src="src/index.js"></script>
</body>
</html>
\`\`\`

For editing an existing file, provide the COMPLETE new content:
\`\`\`file:src/app.js
// ENTIRE file content with your changes
function updated() {
  console.log('New version');
}
\`\`\`

=== RULES ===

1. ALWAYS use \`\`\`file:filename\`\`\` for ANY code - NEVER use \`\`\`language
2. Provide COMPLETE file content when editing - not just snippets
3. Files are created relative to the working directory automatically
4. After creating files, briefly explain what you did
5. If asked to create a website or project, create ALL necessary files`;

// API Client with provider support
class GLMAgent {
  private apiKey: string | null = null;
  private provider: Provider = 'zai'; // Default to Z.ai (GLM 4.7)
  private circuitBreaker: Map<Provider, CircuitBreakerState> = new Map();
  private requestQueue: Promise<any> = Promise.resolve();
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  private providers = {
    zai: {
      baseUrl: 'https://api.z.ai/api/paas/v4/chat/completions',
      model: 'glm-4.7',
      envKey: 'NEXT_PUBLIC_GLM_API_KEY',
    },
    openrouter: {
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'deepseek/deepseek-chat', // DeepSeek V3 via OpenRouter (fast & reliable)
      envKey: 'NEXT_PUBLIC_OPENROUTER_API_KEY',
    },
  };

  setApiKey(key: string) {
    this.apiKey = key;
  }

  setProvider(provider: Provider) {
    this.provider = provider;
  }

  getApiKey(provider?: Provider): string | null {
    // Try cached value first
    if (this.apiKey) return this.apiKey;

    const p = provider || this.provider;
    const config = this.providers[p];

    // Try localStorage first (client-side)
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem(`viraith_${p}_api_key`);
      if (storedKey) {
        this.apiKey = storedKey;
        return storedKey;
      }
    }

    // Try environment variable (Next.js public env)
    const envKey = process.env[config.envKey];
    if (envKey) {
      this.apiKey = envKey;
      // Also save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem(`viraith_${p}_api_key`, envKey);
      }
      return envKey;
    }

    // Try alternative keys for backwards compatibility
    if (p === 'zai') {
      const altKey = process.env.NEXT_PUBLIC_ZAI_API_KEY;
      if (altKey) {
        this.apiKey = altKey;
        return altKey;
      }
    }

    return null;
  }

  // Initialize circuit breaker state for a provider
  private getCircuitBreaker(provider: Provider): CircuitBreakerState {
    if (!this.circuitBreaker.has(provider)) {
      this.circuitBreaker.set(provider, {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0,
      });
    }
    return this.circuitBreaker.get(provider)!;
  }

  // Check if circuit breaker is open (too many failures)
  private isCircuitBreakerOpen(provider: Provider): boolean {
    const state = this.getCircuitBreaker(provider);

    if (!state.isOpen) {
      return false;
    }

    // Check if we should try to close the circuit (after 60 seconds)
    const timeSinceFailure = Date.now() - state.lastFailureTime;
    if (timeSinceFailure > 60000) {
      // Reset and allow requests through
      state.isOpen = false;
      state.failureCount = 0;
      state.successCount = 0;
      this.circuitBreaker.set(provider, state);
      return false;
    }

    return true;
  }

  // Record a successful request
  private recordSuccess(provider: Provider) {
    const state = this.getCircuitBreaker(provider);
    state.successCount++;

    // Close circuit breaker after 3 consecutive successes
    if (state.successCount >= 3 && state.isOpen) {
      state.isOpen = false;
      state.failureCount = 0;
    }

    this.circuitBreaker.set(provider, state);
  }

  // Record a failed request
  private recordFailure(provider: Provider) {
    const state = this.getCircuitBreaker(provider);
    state.failureCount++;
    state.lastFailureTime = Date.now();
    state.successCount = 0;

    // Open circuit breaker after 5 consecutive failures
    if (state.failureCount >= 5) {
      state.isOpen = true;
      console.warn(`[GLM Agent] Circuit breaker opened for ${provider} due to repeated failures`);
    }

    this.circuitBreaker.set(provider, state);
  }

  // Calculate retry delay with exponential backoff
  private calculateRetryDelay(attempt: number, retryAfterHeader?: string | null): number {
    // Respect Retry-After header if provided
    if (retryAfterHeader) {
      const retryAfter = parseInt(retryAfterHeader, 10);
      if (!isNaN(retryAfter)) {
        return Math.min(retryAfter * 1000, this.retryConfig.maxDelay);
      }
    }

    // Exponential backoff: initialDelay * (backoffMultiplier ^ attempt)
    const delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  // Sleep for a specified duration
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async chat(
    messages: AgentMessage[],
    userConfig: AgentConfig = {}
  ): Promise<AgentResponse> {
    const providerConfig = this.providers[this.provider];
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        success: false,
        content: '',
        error: `API key not configured for ${this.provider}. Please set ${providerConfig.envKey} in .env.local`,
      };
    }

    // Check if circuit breaker is open
    if (this.isCircuitBreakerOpen(this.provider)) {
      return {
        success: false,
        content: '',
        error: `Circuit breaker is open for ${this.provider}. Too many recent failures. Please wait a moment before retrying.`,
      };
    }

    // Queue requests to prevent concurrent requests to the same provider
    return this.requestQueue = this.requestQueue.then(async () => {
      return this.chatWithRetry(messages, userConfig, providerConfig, apiKey);
    });
  }

  // Internal method that handles retry logic
  private async chatWithRetry(
    messages: AgentMessage[],
    userConfig: AgentConfig,
    providerConfig: { baseUrl: string; model: string; envKey: string },
    apiKey: string
  ): Promise<AgentResponse> {
    let lastError: string | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        };

        // OpenRouter requires additional headers
        if (this.provider === 'openrouter') {
          headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
          headers['X-Title'] = 'VIRAITH IDE';
        }

        const response = await fetch(providerConfig.baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: providerConfig.model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 4096,
          }),
        });

        // Handle 429 Too Many Requests (rate limit)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = this.calculateRetryDelay(attempt, retryAfter);

          console.warn(`[GLM Agent] Rate limited (429), attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}. Retrying after ${delay}ms...`);

          // Record failure but don't give up yet
          this.recordFailure(this.provider);

          // If we have more retries available, wait and try again
          if (attempt < this.retryConfig.maxRetries) {
            await this.sleep(delay);
            continue;
          }

          lastError = `Rate limit exceeded (429). Tried ${this.retryConfig.maxRetries + 1} times.`;
          break;
        }

        // Handle other error responses
        if (!response.ok) {
          const error = await response.text();
          lastError = `API error (${this.provider}): ${response.status} - ${error}`;

          // Don't retry on client errors (4xx except 429)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            this.recordFailure(this.provider);
            break;
          }

          // Retry on server errors (5xx)
          if (response.status >= 500 && attempt < this.retryConfig.maxRetries) {
            const delay = this.calculateRetryDelay(attempt);
            console.warn(`[GLM Agent] Server error (${response.status}), retrying in ${delay}ms...`);
            this.recordFailure(this.provider);
            await this.sleep(delay);
            continue;
          }

          this.recordFailure(this.provider);
          break;
        }

        // Success!
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Record success and potentially close circuit breaker
        this.recordSuccess(this.provider);

        if (attempt > 0) {
          console.log(`[GLM Agent] Request succeeded after ${attempt} retries`);
        }

        return {
          success: true,
          content,
        };
      } catch (error) {
        const errorMsg = `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        lastError = errorMsg;

        console.error(`[GLM Agent] Request failed (attempt ${attempt + 1}):`, errorMsg);

        // Record failure
        this.recordFailure(this.provider);

        // Retry on network errors if we have retries left
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          console.log(`[GLM Agent] Retrying in ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }

        break;
      }
    }

    // All retries exhausted
    return {
      success: false,
      content: '',
      error: lastError || 'Unknown error occurred',
    };
  }

  // Read file contents from the project
  async readProjectFile(filePath: string): Promise<string | null> {
    if (!isTauri) return null;
    try {
      return await fileApi.read(filePath);
    } catch (error) {
      console.error(`Failed to read file ${filePath}:`, error);
      return null;
    }
  }

  // Get all file paths from the file tree (recursively)
  getFilePathsFromTree(node: any, paths: string[] = []): string[] {
    if (!node) return paths;

    if (node.type === 'file' || (!node.is_directory && !node.isDirectory && !node.children)) {
      paths.push(node.path);
    }

    if (node.children) {
      for (const child of node.children) {
        this.getFilePathsFromTree(child, paths);
      }
    }

    return paths;
  }

  // Read multiple files and format them for context
  async readFilesForContext(filePaths: string[], maxFiles: number = 10): Promise<string> {
    if (!isTauri) return '';

    const relevantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.json', '.md'];
    const relevantFiles = filePaths
      .filter(p => relevantExtensions.some(ext => p.endsWith(ext)))
      .slice(0, maxFiles);

    const fileContents: string[] = [];

    for (const filePath of relevantFiles) {
      try {
        const content = await fileApi.read(filePath);
        if (content && content.length < 5000) { // Skip very large files
          const fileName = filePath.split('/').pop() || filePath;
          fileContents.push(`### ${fileName}\n\`\`\`\n${content}\n\`\`\``);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    if (fileContents.length === 0) return '';

    return `## Existing Project Files\n\n${fileContents.join('\n\n')}`;
  }

  // Execute a task based on card context
  async executeTask(
    task: string,
    context?: {
      folderPath?: string;
      files?: string[];
      additionalContext?: string;
    }
  ): Promise<AgentResponse> {
    const messages: AgentMessage[] = [
      {
        role: 'system',
        content: DEFAULT_SYSTEM_PROMPT,
      },
    ];

    // Add context if available
    if (context?.folderPath) {
      messages.push({
        role: 'user',
        content: `Working directory: ${context.folderPath}`,
      });
    }

    if (context?.additionalContext) {
      messages.push({
        role: 'user',
        content: context.additionalContext,
      });
    }

    // Add the main task
    messages.push({
      role: 'user',
      content: task,
    });

    return this.chat(messages);
  }

  // Generate a prompt template based on task type
  generatePromptTemplate(
    taskType: 'feature' | 'bugfix' | 'refactor' | 'docs' | 'test' | 'general',
    taskTitle: string,
    context?: string
  ): string {
    const templates: Record<string, string> = {
      feature: `Implement the following feature:

**Task:** ${taskTitle}

${context ? `**Context:** ${context}\n\n` : ''}**Requirements:**
- Write clean, maintainable code
- Follow existing code patterns
- Add necessary error handling
- Include brief inline comments for complex logic

Please provide the implementation:`,

      bugfix: `Fix the following issue:

**Bug:** ${taskTitle}

${context ? `**Context:** ${context}\n\n` : ''}**Instructions:**
- Identify the root cause
- Provide a fix that doesn't break existing functionality
- Explain what was wrong and how you fixed it

Please provide the solution:`,

      refactor: `Refactor the following code:

**Task:** ${taskTitle}

${context ? `**Context:** ${context}\n\n` : ''}**Goals:**
- Improve code readability
- Enhance performance where possible
- Maintain existing functionality
- Follow best practices

Please provide the refactored code:`,

      docs: `Write documentation for:

**Subject:** ${taskTitle}

${context ? `**Context:** ${context}\n\n` : ''}**Include:**
- Clear explanation of functionality
- Usage examples
- Parameter descriptions
- Return value documentation

Please provide the documentation:`,

      test: `Write tests for:

**Subject:** ${taskTitle}

${context ? `**Context:** ${context}\n\n` : ''}**Requirements:**
- Cover main functionality
- Include edge cases
- Use appropriate testing patterns
- Add descriptive test names

Please provide the test code:`,

      general: `${taskTitle}

${context ? `**Context:** ${context}` : ''}

Please help with this task:`,
    };

    return templates[taskType] || templates.general;
  }

  // Generate auto-prompt from card title and description
  generateAutoPrompt(
    title: string,
    description?: string,
    folderPath?: string,
    projectContext?: string
  ): string {
    let prompt = `# Task: ${title}\n\n`;

    if (description) {
      prompt += `## Description\n${description}\n\n`;
    }

    if (folderPath) {
      prompt += `## Working Directory\n${folderPath}\n\n`;
    }

    if (projectContext) {
      prompt += `${projectContext}\n\n`;
    }

    prompt += `## Instructions
Analyze this task and implement a solution.

=== CRITICAL: FILE FORMAT ===

You MUST use this format for ALL code files:

\`\`\`file:filename.ext
complete file content here
\`\`\`

Examples:
\`\`\`file:index.html
<!DOCTYPE html>
<html>
<head><title>My Page</title></head>
<body><h1>Hello World</h1></body>
</html>
\`\`\`

\`\`\`file:src/app.js
console.log('App loaded');
\`\`\`

DO NOT use:
- \`\`\`html or \`\`\`javascript (these will NOT create files)
- File snippets (provide COMPLETE file content)

When creating a website or project, create ALL necessary files (HTML, CSS, JS, etc.).

Provide your implementation:`;

    return prompt;
  }

  // Parse agent response for file operations
  parseFileOperations(response: string, basePath?: string): FileOperation[] {
    const operations: FileOperation[] = [];

    // Match ```file:path\ncontent\n``` blocks
    const fileBlockRegex = /```file:([^\n]+)\n([\s\S]*?)```/g;
    let match;

    while ((match = fileBlockRegex.exec(response)) !== null) {
      const filePath = match[1].trim();
      const content = match[2];

      // Resolve path relative to base path
      const fullPath = basePath
        ? `${basePath}/${filePath}`.replace(/\/+/g, '/')
        : filePath;

      operations.push({
        type: 'create', // Will be changed to 'modify' if file exists
        path: fullPath,
        content: content,
      });
    }

    return operations;
  }

  // Fallback: Convert regular code blocks to file operations
  // This handles cases where the AI uses ```html, ```javascript, etc. instead of ```file:path
  convertCodeBlocksToFileOperations(response: string, basePath?: string): FileOperation[] {
    const operations: FileOperation[] = [];

    // Map language to default file extension/name
    const languageExtensions: Record<string, string> = {
      'html': 'index.html',
      'css': 'styles.css',
      'javascript': 'script.js',
      'js': 'script.js',
      'typescript': 'script.ts',
      'ts': 'script.ts',
      'tsx': 'App.tsx',
      'jsx': 'App.jsx',
      'python': 'main.py',
      'py': 'main.py',
      'json': 'data.json',
      'md': 'README.md',
      'markdown': 'README.md',
      'xml': 'file.xml',
      'yaml': 'config.yaml',
      'yml': 'config.yml',
      'bash': 'script.sh',
      'sh': 'script.sh',
      'sql': 'query.sql',
      'rust': 'main.rs',
      'go': 'main.go',
      'java': 'Main.java',
      'c': 'main.c',
      'cpp': 'main.cpp',
    };

    // Match regular code blocks: ```language\ncontent\n```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    let fileCounter = 1;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      const language = match[1]?.toLowerCase() || '';
      const content = match[2];

      // Skip if this is already a file block (handled by parseFileOperations)
      if (!language) continue;

      // Determine filename from language
      let filename = languageExtensions[language] || `file${fileCounter}.${language}`;

      // Check if there's a filename hint in the text before the code block
      const beforeText = response.slice(0, match.index);
      const filenameHintMatch = beforeText.match(/(\w+\.\w+)\s*$/m);
      if (filenameHintMatch) {
        filename = filenameHintMatch[1];
      }

      // Resolve path relative to base path
      const fullPath = basePath
        ? `${basePath}/${filename}`.replace(/\/+/g, '/')
        : filename;

      operations.push({
        type: 'create',
        path: fullPath,
        content: content,
      });

      fileCounter++;
    }

    return operations;
  }

  // Execute file operations
  async executeFileOperations(operations: FileOperation[]): Promise<{
    success: boolean;
    created: string[];
    modified: string[];
    errors: string[];
  }> {
    const created: string[] = [];
    const modified: string[] = [];
    const errors: string[] = [];

    if (!isTauri) {
      return {
        success: false,
        created,
        modified,
        errors: ['File operations require Tauri context'],
      };
    }

    for (const op of operations) {
      try {
        if (op.type === 'create' || op.type === 'modify') {
          // Check if file exists
          const exists = await fileApi.exists(op.path);

          // Create parent directories if needed
          const parentDir = op.path.substring(0, op.path.lastIndexOf('/'));
          if (parentDir) {
            try {
              await fileApi.createDirectory(parentDir);
            } catch {
              // Directory might already exist
            }
          }

          // Write the file
          await fileApi.write(op.path, op.content || '');

          if (exists) {
            modified.push(op.path);
          } else {
            created.push(op.path);
          }
        } else if (op.type === 'delete') {
          await fileApi.delete(op.path);
        }
      } catch (error) {
        errors.push(`Failed to ${op.type} ${op.path}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      created,
      modified,
      errors,
    };
  }

  // Refresh the file tree in the sidebar
  refreshFileTree() {
    // Use the file store to trigger a refresh
    const { refreshFileTree } = useFileStore.getState();
    refreshFileTree();
  }

  // Execute task with file operations and context reading
  async executeTaskWithFiles(
    task: string,
    context?: {
      folderPath?: string;
      files?: string[];
      additionalContext?: string;
      projectFileContent?: string;
    }
  ): Promise<AgentResponse> {
    // Build enhanced context with existing files
    let enhancedContext = context?.additionalContext || '';

    // Read existing project files for context if we have a folder path
    if (context?.folderPath && isTauri) {
      try {
        // Get the file tree
        const fileTree = useFileStore.getState().fileTree;
        if (fileTree) {
          const filePaths = this.getFilePathsFromTree(fileTree);
          const filesContext = await this.readFilesForContext(filePaths, 5);
          if (filesContext) {
            enhancedContext = filesContext + '\n\n' + enhancedContext;
          }
        }
      } catch (error) {
        console.error('Failed to read project files for context:', error);
      }
    }

    // First, get the AI response
    console.log('[GLM Agent] Sending task to AI...');
    const response = await this.executeTask(task, {
      ...context,
      additionalContext: enhancedContext,
    });

    if (!response.success) {
      console.error('[GLM Agent] AI request failed:', response.error);
      return response;
    }

    console.log('[GLM Agent] AI response received, length:', response.content.length);

    // Parse file operations from response
    let operations = this.parseFileOperations(response.content, context?.folderPath);

    // Fallback: Try to convert regular code blocks to file blocks if no file blocks found
    if (operations.length === 0) {
      console.log('[GLM Agent] No file blocks found, attempting fallback conversion...');
      operations = this.convertCodeBlocksToFileOperations(response.content, context?.folderPath);
      console.log('[GLM Agent] Fallback converted', operations.length, 'files');
    }

    console.log('[GLM Agent] Parsed', operations.length, 'file operations');

    if (operations.length > 0) {
      // Execute file operations
      const result = await this.executeFileOperations(operations);

      console.log('[GLM Agent] File operations result:', {
        created: result.created.length,
        modified: result.modified.length,
        errors: result.errors.length,
      });

      // Refresh the file tree to show new/modified files
      if (result.created.length > 0 || result.modified.length > 0) {
        this.refreshFileTree();
      }

      return {
        ...response,
        filesCreated: result.created,
        filesModified: result.modified,
        error: result.errors.length > 0 ? result.errors.join('\n') : undefined,
      };
    }

    console.warn('[GLM Agent] No file operations found in response. Preview:', response.content.slice(0, 200));
    return response;
  }
}

// Singleton instance
export const glmAgent = new GLMAgent();

// Helper to set API key
export function setGLMApiKey(key: string) {
  glmAgent.setApiKey(key);
  if (typeof window !== 'undefined') {
    localStorage.setItem('glm_api_key', key);
  }
}

// Helper to check if API key is configured
export function isAgentConfigured(): boolean {
  return !!glmAgent.getApiKey();
}
