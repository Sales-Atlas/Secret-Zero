---
description: "Ensures all code, comments, and documentation are written in English."
globs: "**/*"
alwaysApply: true
---

# Language Policy

All technical artifacts created in this project must be written in **English**. This applies regardless of the language used for communication with the AI Agent.

## Scope

- **Source Code**: Variable names, function names, class names, etc.
- **Comments**: Inline comments, JSDoc, Docstrings.
- **Documentation**: README files, markdown documents, technical specifications.
- **Commit Messages**: All git commit messages.

## Guidelines

1. **Code**: Use standard English naming conventions.
2. **Comments**: Explain logic and intent in English.
3. **Documents**: Draft all project documentation in English.
4. **Consistency**: Do not mix languages within the codebase or documentation.

## Examples

### Code and Comments

```typescript
// ✅ Good: English naming and comments
/**
 * Calculates the total price of the items.
 */
function calculateTotalPrice(items: Item[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}

// ❌ Bad: Non-English naming or comments
/**
 * Oblicza całkowitą cenę przedmiotów.
 */
function obliczCeneCalkowita(elementy: Element[]): number {
  return elementy.reduce((suma, el) => suma + el.cena, 0);
}
```

