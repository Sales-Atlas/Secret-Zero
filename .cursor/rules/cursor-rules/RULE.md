---
description: "How to add or edit Cursor rules in your project according to the new Project Rules specification"
globs: .cursor/rules/**/*
alwaysApply: false
---

# Rules Management Guide

Rules provide system-level instructions to Agent. They bundle prompts, scripts, and more together, making it easy to manage and share workflows across your team.

## How rules work

Large language models don't retain memory between completions. Rules provide persistent, reusable context at the prompt level. When applied, rule contents are included at the start of the model context, giving the AI consistent guidance for code generation, interpreting edits, or assisting with workflows.

## Rule types

Cursor supports four types of rules:

- **Project Rules**: Stored in `.cursor/rules`, version-controlled and scoped to your codebase.
- **User Rules**: Global to your Cursor environment (defined in settings).
- **Team Rules**: Managed centrally for your organization (Team/Enterprise plans).
- **AGENTS.md**: Agent instructions in markdown format (a simple alternative).

## Project Rules

Project rules live in `.cursor/rules`. Each rule is a **folder** containing a `RULE.md` file. They are version-controlled and can be automatically applied based on path patterns (globs).

### Rule folder structure

A rule folder can contain:

- **`RULE.md`** — The main rule file with frontmatter metadata and instructions.
- **Scripts and prompts** — Optional additional files referenced by the rule.

```text
.cursor/rules/
  my-rule/
    RULE.md           # Main rule file
    scripts/          # Helper scripts (optional)
```

### RULE.md anatomy

Each `RULE.md` file starts with a frontmatter section:

```markdown
---
description: "Short description of the rule's purpose"
globs: "**/*.ts"
alwaysApply: false
---

...rule content
```

- **description**: Used by the Agent to decide if the rule is relevant in a given context (if `alwaysApply` is `false`).
- **globs**: File patterns the rule should apply to (e.g., `**/*.tsx`).
- **alwaysApply**: If `true`, the rule will be applied to every chat session.

## Guidelines for creating content

For rules to be effective, they should be specific and actionable:

1. **Be precise and action-oriented** - Provide clear instructions, avoid vagueness.
2. **Use code examples** - Show both good (✅) and bad (❌) practices.
3. **Reference files and rules** - Use the `@filename` format or `[description](mdc:path/to/file)`.
4. **One rule, one topic** - Focus on a specific pattern, technology, or concern.
5. **Explain context** - Explaining "why" a rule exists helps the AI apply it better.
6. **Language standard** - Always write rule content in **English** to ensure consistency and best performance with AI models.

### Code examples format

```typescript
// ✅ Good: Clear and follows conventions
function processUser({ id, name }: User) {
  return { id, displayName: name };
}

// ❌ Bad: Unclear parameter passing
function processUser(id: string, name: string) {
  return { id, displayName: name };
}
```

## Rule categories

It is recommended to organize rules by purpose:

- **Code Style**: e.g., `typescript-style`, `css-conventions`
- **Architecture**: e.g., `component-patterns`, `folder-structure`
- **Tools**: e.g., `testing-patterns`, `build-config`
- **Meta**: e.g., `cursor-rules`, `self-improve`

## Best practices

- Keep rules under 500 lines.
- Split large rules into smaller, composable modules.
- Write rules like clear internal documentation.
- Regularly review and update rules as the codebase evolves.
- Reuse rules instead of repeating the same prompts in chat.

## AGENTS.md

`AGENTS.md` is a simple markdown file without metadata, used for defining agent instructions.

- Supports nesting: You can place `AGENTS.md` in subdirectories. They will apply to files in that directory and its children.
- Instructions from nested files are merged with those from parent directories, with more specific instructions taking precedence.

## Legacy and Deprecation

- The `.cursorrules` (legacy) file in the root directory is **deprecated**. We recommend migrating to Project Rules or `AGENTS.md`.
- `.mdc` rules are legacy. All new rules should be created as folders in `.cursor/rules` containing a `RULE.md` file.
