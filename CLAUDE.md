# Project Instructions

## Code Style

- **No `as any`**: Never use `as any` casts. Use proper typing with generics, type narrowing, or `Record<string, unknown>` as needed.

## Before committing and pushing

When asked to commit and push, always perform these checks first:

1. **Run tests**: Execute `npm run test:run` and ensure all tests pass. If any tests fail due to your changes, fix them or update them as needed.
2. **Check for missing migrations**: Compare the Prisma schema (`prisma/schema.prisma`) against existing migrations in `prisma/migrations/` to ensure every field has a corresponding migration. Create any missing migrations before committing.
