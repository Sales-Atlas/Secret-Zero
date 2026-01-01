# Language Policy

All technical artifacts created in this project must be written in **English**. This applies regardless of the language used for communication with the AI Agent.

## Scope

- **Source Code**: Variable names, function names, class names, etc.
- **Comments**: Inline comments, JSDoc, Docstrings.
- **Documentation**: README files, markdown documents, technical specifications.
- **Commit Messages**: All git commit messages.
- **Development Log**: `development_log.md` entries must be in English.

## Guidelines

1. **Code**: Use standard English naming conventions
2. **Comments**: Explain logic and intent in English
3. **Documents**: Draft all project documentation in English
4. **Consistency**: Do not mix languages within the codebase or documentation

## Examples

### Code and Comments

✅ **Good**: English naming and comments

```typescript
/**
 * Calculates the total price of the items.
 */
function calculateTotalPrice(items: Item[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}
```

❌ **Bad**: Non-English naming or comments

```typescript
/**
 * Oblicza całkowitą cenę przedmiotów.
 */
function obliczCeneCalkowita(elementy: Element[]): number {
  return elementy.reduce((suma, el) => suma + el.cena, 0);
}
```

### Commit Messages

✅ **Good**: Clear English commit message

```
Add encryption layer for client-side secret handling

- Implement AES-256-GCM for payload encryption
- Add RSA-OAEP key wrapping for server public key
- Validate session before processing requests
```

❌ **Bad**: Non-English or unclear message

```
Dodaj szyfrowanie
```

### Development Log Entries

✅ **Good**: Timestamped English entry

```
20250101T143000Z: Implemented client-side encryption for secret deposits. Added AES-256-GCM encryption with RSA key wrapping. All tests passing.
```

❌ **Bad**: Non-English entry

```
20250101T143000Z: Dodane szyfrowanie po stronie klienta
```
