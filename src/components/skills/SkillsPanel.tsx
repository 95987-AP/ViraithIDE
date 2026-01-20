'use client';

import { useEffect, useState } from 'react';
import {
  Wand2,
  Plus,
  Trash2,
  X,
  Braces,
  Server,
  Database,
  TestTube,
  Cloud,
  Palette,
  FileText,
  MoreHorizontal,
} from 'lucide-react';
import { useSkillsStore } from '@/store/skillsStore';
import { useDraggable } from '@dnd-kit/core';
import type { Skill, SkillCategory } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion } from 'framer-motion';

const CATEGORY_ICONS: Record<SkillCategory, React.ComponentType<{ className?: string }>> = {
  frontend: Braces,
  backend: Server,
  database: Database,
  testing: TestTube,
  devops: Cloud,
  design: Palette,
  documentation: FileText,
  general: Wand2,
};

const CATEGORY_COLORS: Record<SkillCategory, string> = {
  frontend: 'text-accent',
  backend: 'text-status-info',
  database: 'text-status-warning',
  testing: 'text-status-success',
  devops: 'text-status-error',
  design: 'text-purple-400',
  documentation: 'text-text-muted',
  general: 'text-text-primary',
};

interface DraggableSkillProps {
  skill: Skill;
}

function DraggableSkill({ skill }: DraggableSkillProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `skill-${skill.id}`,
    data: {
      type: 'skill',
      skill,
    },
  });

  const Icon = CATEGORY_ICONS[skill.category];
  const colorClass = CATEGORY_COLORS[skill.category];

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        p-3 rounded-sm border border-border-subtle bg-surface-elevated
        hover:border-accent/50 hover:bg-surface cursor-grab active:cursor-grabbing
        transition-all
        ${isDragging ? 'opacity-50 ring-2 ring-accent' : ''}
      `}
    >
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 ${colorClass} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-mono text-text-primary truncate">{skill.name}</h4>
          <p className="text-xs text-text-muted mt-1 line-clamp-2">{skill.description}</p>
          {skill.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {skill.tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="text-2xs px-1.5 py-0.5 bg-background text-text-muted rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {!skill.isBuiltIn && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="btn-icon p-0.5 opacity-0 group-hover:opacity-100 hover:bg-surface-hover"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="panel-elevated p-1 min-w-[120px] z-50">
                <DropdownMenu.Item
                  onClick={() => useSkillsStore.getState().deleteSkill(skill.id)}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-status-error hover:bg-surface rounded-sm cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
    </div>
  );
}

export function SkillsPanel() {
  const { skills, loadSkills, addSkill, importSkillFromMarkdown } = useSkillsStore();
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importName, setImportName] = useState('');
  const [importContent, setImportContent] = useState('');
  const [importCategory, setImportCategory] = useState<SkillCategory>('general');

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const categories: { value: SkillCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Skills' },
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
    { value: 'database', label: 'Database' },
    { value: 'testing', label: 'Testing' },
    { value: 'devops', label: 'DevOps' },
    { value: 'design', label: 'Design' },
    { value: 'documentation', label: 'Docs' },
    { value: 'general', label: 'General' },
  ];

  const filteredSkills =
    selectedCategory === 'all'
      ? skills
      : skills.filter((s) => s.category === selectedCategory);

  const handleImport = () => {
    if (importName.trim() && importContent.trim()) {
      importSkillFromMarkdown(importName, importContent, importCategory);
      setImportName('');
      setImportContent('');
      setShowImportDialog(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-accent" />
            <span className="text-sm font-mono text-text-primary">Skills</span>
          </div>
          <button
            onClick={() => setShowImportDialog(true)}
            className="btn-icon p-0.5"
            title="Import skill"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-border-subtle">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`
                text-2xs px-2 py-1 rounded-sm font-mono transition-colors
                ${
                  selectedCategory === cat.value
                    ? 'bg-accent text-background'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-elevated'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Skills list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredSkills.length === 0 ? (
            <div className="text-center py-8">
              <Wand2 className="w-8 h-8 text-text-dim mx-auto mb-2" />
              <p className="text-sm text-text-muted">No skills found</p>
              <p className="text-2xs text-text-dim mt-1">
                Import skills from .md files
              </p>
            </div>
          ) : (
            filteredSkills.map((skill) => (
              <DraggableSkill key={skill.id} skill={skill} />
            ))
          )}
        </div>

        {/* Hint */}
        <div className="px-3 py-2 border-t border-border-subtle">
          <p className="text-2xs text-text-dim text-center">
            Drag skills to cards to add context
          </p>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog.Root open={showImportDialog} onOpenChange={setShowImportDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-h-[80vh] bg-surface border border-border rounded-sm z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <Dialog.Title className="font-mono text-sm text-text-primary flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-accent" />
                Import Skill
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="btn-icon p-1">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs text-text-muted mb-2 font-mono">
                  Skill Name
                </label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="e.g., TypeScript Expert"
                  className="input-terminal w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-2 font-mono">
                  Category
                </label>
                <select
                  value={importCategory}
                  onChange={(e) => setImportCategory(e.target.value as SkillCategory)}
                  className="input-terminal w-full"
                >
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="database">Database</option>
                  <option value="testing">Testing</option>
                  <option value="devops">DevOps</option>
                  <option value="design">Design</option>
                  <option value="documentation">Documentation</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-2 font-mono">
                  Skill Content (Markdown)
                </label>
                <textarea
                  value={importContent}
                  onChange={(e) => setImportContent(e.target.value)}
                  placeholder="# Your Skill Name

You are expert at...

## Guidelines
- Guideline 1
- Guideline 2

tags: tag1, tag2, tag3"
                  className="input-terminal w-full h-48 resize-none font-mono text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle">
              <Dialog.Close asChild>
                <button className="btn-ghost text-sm">Cancel</button>
              </Dialog.Close>
              <button
                onClick={handleImport}
                disabled={!importName.trim() || !importContent.trim()}
                className="btn-primary text-sm"
              >
                Import Skill
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
