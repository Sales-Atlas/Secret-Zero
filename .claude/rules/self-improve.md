# Rule Improvement Guide

Guidelines for continuously improving Claude Code rules based on emerging code patterns and best practices.

## Rule Improvement Triggers

- New code patterns not covered by existing rules
- Repeated similar implementations across files
- Common error patterns that could be prevented
- New libraries or tools being used consistently
- Emerging best practices in the codebase

## Analysis Process

- Compare new code with existing rules
- Identify patterns that should be standardized
- Look for references to external documentation
- Check for consistent error handling patterns
- Monitor test patterns and coverage

## Rule Updates

### Add New Rules When

- A new technology/pattern is used in 3+ files
- Common bugs could be prevented by a rule
- Code reviews repeatedly mention the same feedback
- New security or performance patterns emerge

### Modify Existing Rules When

- Better examples exist in the codebase
- Additional edge cases are discovered
- Related rules have been updated
- Implementation details have changed

### Example Pattern Recognition

If you see repeated patterns like:

```typescript
const secrets = await infisical.secrets().listSecrets({
  environment: 'production',
  projectId: projectId,
  secretPath: `/${environment}/${orgSlug}/`
});
```

Consider adding to the tech-stack rule:
- Standard path formats for secret organization
- Environment-specific configurations
- Performance optimization patterns

## Rule Quality Checks

- Rules should be actionable and specific
- Examples should come from actual code
- References should be up to date
- Patterns should be consistently enforced

## Continuous Improvement

- Monitor code review comments
- Track common development questions
- Update rules after major refactors
- Add links to relevant documentation
- Cross-reference related rules

## Rule Deprecation

- Mark outdated patterns as deprecated
- Remove rules that no longer apply
- Update references to deprecated rules
- Document migration paths for old patterns

## Documentation Updates

- Keep examples synchronized with code
- Update references to external docs
- Maintain links between related rules
- Document breaking changes

## Security-First Updates

For Secret-Zero, pay special attention to:

1. **Encryption Patterns**: Ensure all secret handling follows client-side encryption principles
2. **Authentication Flow**: Track changes to Stytch integration and session management
3. **Write-Only Architecture**: Verify all new features maintain write-only secret access
4. **Environment Variables**: Keep track of new secrets that need Zod validation
5. **Log Safety**: Monitor that no secrets leak into logs
