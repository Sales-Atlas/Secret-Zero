---
description: "Guidelines for handling files protected by ignore rules (.gitignore, .cursorignore, global ignore)"
globs: "**/*"
alwaysApply: true
---

# File Access and Ignore Rules

When working with files that are blocked by ignore patterns (`.gitignore`, `.cursorignore`, global ignore rules), follow these guidelines to avoid accidentally overwriting or losing important configuration files.

## Core Principle

**Never directly overwrite or modify protected files.** Instead, create template/example files that users can copy and configure.

## Protected File Patterns

Files that are commonly protected and should not be directly modified:

- `.env*` files (environment variables)
- `*.key`, `*.pem`, `*.crt` (private keys and certificates)
- `secrets.*`, `config.local.*` (local configuration)
- Files explicitly blocked by `.cursorignore` or global ignore rules

## Handling Protected Files

### ❌ Bad: Direct file modification

```bash
# Don't do this if .env.local is blocked by .cursorignore
echo "NEW_CONFIG=value" > .env.local
```

```bash
# Don't overwrite existing protected files
cp template.env .env.local  # Overwrites user's configuration
```

### ✅ Good: Create template files

```bash
# Create .env.example instead of .env.local
cat > .env.example << 'EOF'
# Template for environment variables
# Copy this to .env.local and fill in your values
MY_CONFIG=value
DATABASE_URL=postgresql://localhost:5432/mydb
EOF
```

```bash
# Use .template, .sample, or .example extensions
cp config.json config.template
```

## Template Creation Strategy

1. **Check file accessibility** before attempting to read or write
2. **Create example/template versions** for protected files
3. **Document the required structure** with clear comments
4. **Provide setup instructions** for users to copy and configure

## Practical Examples

### Environment Variables

```bash
# ✅ Good: Create template for environment setup
cat > .env.example << 'EOF'
# Environment Variables Template
# Copy to .env.local and replace with actual values

# Database
DATABASE_URL=postgresql://localhost:5432/myapp

# API Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Application
NODE_ENV=development
PORT=3000
EOF
```

### Configuration Files

```bash
# ✅ Good: Create sample configuration
cat > config.sample.json << 'EOF'
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp"
  },
  "features": {
    "enableLogging": true,
    "debugMode": false
  }
}
EOF
```

## When Files Already Exist

If a protected file already exists:

1. **Read it first** (if accessible) to understand its structure
2. **Create a backup** or template version with different name
3. **Document changes** needed for the user to apply manually
4. **Never overwrite** without explicit user confirmation

## Documentation Requirements

When creating templates:

- Include clear comments explaining each variable/setting
- Provide examples of expected values
- Document any required formats or constraints
- Explain how to copy and customize the template

## Security Considerations

- Never include real secrets or credentials in template files
- Use placeholder values that are obviously not real (e.g., `your-secret-key-here`)
- Document security requirements in comments
- Remind users to never commit actual secrets to version control

## Migration Path

For existing code that may have violated this rule:

1. Identify any direct modifications to protected files
2. Create appropriate template files
3. Update code to reference templates instead of protected files
4. Document the migration steps for users
