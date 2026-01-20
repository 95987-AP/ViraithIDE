import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Skill, BuiltInSkill, SkillCategory } from '@/types';

interface SkillsState {
  skills: Skill[];
  isLoading: boolean;

  // Actions
  loadSkills: () => void;
  addSkill: (skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSkill: (skillId: string, updates: Partial<Skill>) => void;
  deleteSkill: (skillId: string) => void;
  getSkillsByCategory: (category: SkillCategory) => Skill[];
  importSkillFromMarkdown: (name: string, content: string, category: SkillCategory) => void;
}

// Built-in skills that come with VIRAITH
const BUILT_IN_SKILLS: BuiltInSkill[] = [
  {
    name: 'React Development',
    description: 'Build modern React applications with hooks, components, and state management',
    category: 'frontend',
    tags: ['react', 'jsx', 'tsx', 'hooks', 'components'],
    content: `# React Development Skill

You are expert at building React applications with:
- Functional components with hooks (useState, useEffect, useContext, useMemo, useCallback)
- TypeScript for type safety
- Component composition and prop patterns
- State management with Context API or Zustand
- Custom hooks for reusable logic
- Optimizing performance with memo and lazy loading

## Code Style
- Use functional components over class components
- Prefer hooks over HOCs and render props
- Keep components small and focused
- Use TypeScript for props typing
- Follow React best practices and patterns`,
  },
  {
    name: 'Next.js Full Stack',
    description: 'Build full-stack applications with Next.js, API routes, and server components',
    category: 'backend',
    tags: ['nextjs', 'api', 'ssr', 'ssg', 'app-router'],
    content: `# Next.js Full Stack Skill

You are expert at building Next.js applications with:
- App Router with Server and Client Components
- Server Actions for mutations
- API Routes for backend logic
- Server-Side Rendering (SSR) and Static Site Generation (SSG)
- Route handlers and middleware
- Data fetching with caching strategies
- File-based routing and layouts

## Best Practices
- Use Server Components by default, Client Components when needed
- Leverage Server Actions for form submissions
- Implement proper error boundaries and loading states
- Optimize images with next/image
- Use revalidatePath/revalidateTag for cache invalidation`,
  },
  {
    name: 'Database Design',
    description: 'Design efficient database schemas and write optimized SQL queries',
    category: 'database',
    tags: ['sql', 'database', 'schema', 'prisma', 'postgresql'],
    content: `# Database Design Skill

You are expert at database design with:
- Normalized schema design (3NF)
- Proper indexing for performance
- Foreign keys and relationships
- Query optimization
- Prisma ORM integration
- Migration strategies

## Principles
- Design for data integrity first
- Use appropriate data types
- Plan for future scalability
- Index frequently queried columns
- Avoid N+1 queries with proper joins`,
  },
  {
    name: 'Testing',
    description: 'Write comprehensive tests for applications using Jest, Vitest, and Playwright',
    category: 'testing',
    tags: ['jest', 'vitest', 'playwright', 'testing', 'e2e'],
    content: `# Testing Skill

You are expert at testing with:
- Unit tests with Vitest/Jest
- Integration tests for API endpoints
- E2E tests with Playwright
- Testing Library for component testing
- Mocking and test doubles
- Test coverage and quality gates

## Testing Strategy
- Test user behavior, not implementation
- Write tests before features (TDD when appropriate)
- Keep tests fast and reliable
- Use descriptive test names
- One assertion per test ideal
- Mock external dependencies`,
  },
  {
    name: 'Tailwind CSS',
    description: 'Style applications quickly with utility-first CSS framework',
    category: 'design',
    tags: ['tailwind', 'css', 'styling', 'responsive', 'design'],
    content: `# Tailwind CSS Skill

You are expert at styling with Tailwind CSS:
- Utility-first CSS approach
- Responsive design with breakpoints
- Dark mode implementation
- Custom config and theme extension
- Component variants and props
- Animations and transitions

## Best Practices
- Use semantic spacing (spacing scale)
- Extract repeated patterns to components
- Use @apply sparingly, prefer utilities
- Leverage responsive modifiers (md:, lg:)
- Use arbitrary values only when needed
- Maintain consistent color palette`,
  },
  {
    name: 'API Development',
    description: 'Build RESTful and GraphQL APIs with proper validation and error handling',
    category: 'backend',
    tags: ['api', 'rest', 'graphql', 'validation', 'zod'],
    content: `# API Development Skill

You are expert at building APIs with:
- RESTful design principles
- Proper HTTP methods and status codes
- Request validation with Zod
- Error handling and responses
- Authentication and authorization
- Rate limiting and security
- OpenAPI/Swagger documentation

## Standards
- Use nouns for resource endpoints
- Implement proper pagination
- Version your API when needed
- Return consistent response formats
- Validate all input data
- Never expose sensitive data`,
  },
];

const STORAGE_KEY = 'viraith_skills';

export const useSkillsStore = create<SkillsState>()(
  immer((set, get) => ({
    skills: [],
    isLoading: false,

    loadSkills: () => {
      // Try to load from localStorage
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            set({ skills: parsed });
            return;
          } catch {
            // Fall through to built-in skills
          }
        }

        // Initialize with built-in skills
        const builtInSkills: Skill[] = BUILT_IN_SKILLS.map((skill, index) => ({
          id: `builtin-${index}`,
          ...skill,
          isBuiltIn: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));

        set({ skills: builtInSkills });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(builtInSkills));
      }
    },

    addSkill: (skill) => {
      set((state) => {
        const newSkill: Skill = {
          ...skill,
          id: `skill-${Date.now()}`,
          isBuiltIn: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        state.skills.push(newSkill);

        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state.skills));
        }
      });
    },

    updateSkill: (skillId, updates) => {
      set((state) => {
        const index = state.skills.findIndex((s) => s.id === skillId);
        if (index !== -1) {
          state.skills[index] = {
            ...state.skills[index],
            ...updates,
            updatedAt: Date.now(),
          };

          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.skills));
          }
        }
      });
    },

    deleteSkill: (skillId) => {
      set((state) => {
        // Don't allow deleting built-in skills
        const skill = state.skills.find((s) => s.id === skillId);
        if (skill && !skill.isBuiltIn) {
          state.skills = state.skills.filter((s) => s.id !== skillId);

          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.skills));
          }
        }
      });
    },

    getSkillsByCategory: (category) => {
      return get().skills.filter((s) => s.category === category);
    },

    importSkillFromMarkdown: (name, content, category) => {
      set((state) => {
        // Parse description from content (first # heading or first paragraph)
        const descriptionMatch = content.match(/^#\s+(.+)$/m);
        const description = descriptionMatch
          ? descriptionMatch[1].replace(/ Skill$/, '')
          : name;

        // Extract tags from content
        const tagsMatch = content.match(/tags?:\s*(.+)$/m);
        const tags = tagsMatch
          ? tagsMatch[1].split(',').map((t) => t.trim().toLowerCase())
          : [];

        const newSkill: Skill = {
          id: `imported-${Date.now()}`,
          name,
          description,
          category,
          content,
          tags,
          isBuiltIn: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        state.skills.push(newSkill);

        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state.skills));
        }
      });
    },
  }))
);

// Helper to get skill content for agent context
export function getSkillsPrompt(selectedSkillIds: string[]): string {
  const skills = useSkillsStore.getState().skills;
  const selectedSkills = skills.filter((s) => selectedSkillIds.includes(s.id));

  if (selectedSkills.length === 0) return '';

  return `
## Available Skills

${selectedSkills.map((skill) => `
### ${skill.name}
${skill.description}

${skill.content}
`).join('\n---\n')}

Use these skills as guidelines for your work.
`;
}
