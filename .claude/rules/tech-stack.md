# Technology Stack Guidelines

This rule outlines the approved technology stack for the Secret-Zero application, including specific versions and best practices for each component.

## Core Framework

### Next.js 16.1.1

- **Framework**: Next.js with App Router
- **React**: 19.2.3
- **TypeScript**: 5.x
- **Best Practices**:
  - Always use App Router for new features
  - Implement Server Components where possible
  - Use Server Actions for form submissions and data mutations
  - Enable React Taint API for security (`taint: true` in next.config.ts)

### React 19.2.3

- **Features**: Latest React with concurrent features, Server Components
- **Best Practices**:
  - Prefer Server Components over Client Components
  - Use React Hook Form for complex forms instead of controlled components
  - Implement proper error boundaries for production stability

## Authentication & Security

### Stytch B2B Authentication

- **@stytch/nextjs**: ^21.11.1
- **@stytch/vanilla-js**: ^5.44.0
- **stytch**: ^11.0.0
- **Best Practices**:
  - Use StytchB2BProvider for Next.js integration
  - Implement proper session management with middleware
  - Store sensitive auth data securely (never in localStorage)
  - Use Discovery Flow for B2B organization management

### Infisical Secrets Management

- **@infisical/sdk**: ^4.0.4 (SDK v4 API - all versions prior to 4.0.0 are deprecated)
- **Best Practices**:
  - Never hardcode secrets in code
  - Use environment-specific configurations
  - Implement proper error handling for missing secrets
  - Regularly rotate sensitive credentials
  - Authenticate once per server action with `client.auth().universalAuth.login()`
  - Handle duplicate keys by adding timestamp suffix if key exists

## UI & Styling

### Tailwind CSS v4

- **Version**: ^4.x (latest major version)
- **Best Practices**:
  - Use design tokens and consistent spacing scale
  - Leverage Tailwind's utility classes over custom CSS
  - Implement responsive design with mobile-first approach
  - Use CSS variables for theme customization

### ShadCN UI Components

- **shadcn**: ^3.6.2
- **Best Practices**:
  - Use shadcn components as base for consistent UI
  - Customize components using CSS variables
  - Follow accessibility guidelines (ARIA labels, keyboard navigation)
  - Maintain component consistency across the application

### Base UI

- **@base-ui/react**: ^1.0.0
- **Best Practices**:
  - Use for complex interactive components
  - Ensure proper accessibility implementation
  - Follow React 19 compatibility guidelines

## Forms & Validation

### React Hook Form + Zod

- **react-hook-form**: ^7.69.0
- **zod**: ^3.25.0
- **@hookform/resolvers**: ^5.0.0
- **Best Practices**:
  - Always use schema-based validation with Zod
  - Implement proper error handling and user feedback
  - Use controlled components sparingly - prefer uncontrolled with RHF
  - Validate on blur and submit for optimal UX

## Development Tools

### ESLint ^9

- **Configuration**: Next.js ESLint config
- **Best Practices**:
  - Fix all linting errors before committing
  - Use TypeScript ESLint rules for type safety
  - Configure rules for React 19 and Next.js 16 compatibility

### Additional Libraries

- **lucide-react**: ^0.562.0 (Icons)
- **class-variance-authority**: ^0.7.1 (Component variants)
- **clsx**: ^2.1.1 (Conditional classes)
- **tw-animate-css**: ^1.4.0 (CSS animations)

## Version Management

- Keep dependencies updated but stable
- Use caret (^) for patch and minor updates
- Pin major versions explicitly for breaking changes
- Regularly audit dependencies for security vulnerabilities

## Architecture Principles

- Server-first approach with Next.js App Router
- Type-safe development with TypeScript
- Component-based UI with consistent design system
- Secure authentication with proper session management
- Form validation with schema-based approach
