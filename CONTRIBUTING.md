# Contributing to WhiteSmoke

Thank you for your interest in contributing to WhiteSmoke! This guide covers the process for contributing code, documentation, and content to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on ideas, not individuals
- Report issues privately before public disclosure

## How to Contribute

### Reporting Bugs

**Before submitting:**
1. Check existing issues for duplicates
2. Test with latest `main` branch
3. Note your environment (OS, Wine version, hardware)

**Issue template:**
```
### Description
Brief description of the bug

### Steps to Reproduce
1. Install app X
2. Launch with command Y
3. Error occurs

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Environment
- OS: Ubuntu 24.04
- Wine: 9.0
- Hardware: AMD Ryzen 5, 16GB RAM

### Logs
```
<error output here>
```
```

### Suggesting Enhancements

**Issue template:**
```
### Title
Brief feature request

### Use Case
Explain the problem you're trying to solve

### Proposed Solution
How should this work? Include examples:
```bash
# Example:
ws-cli optimize <app-id> --profile gaming
```

### Alternatives Considered
Other ways to solve this

### Additional Context
Links, references, research
```

### Code Contributions

**Fork & Branch**
```bash
# Fork the repo, then:
git clone https://github.com/YOUR-USERNAME/WhiteSmoke.git
cd WhiteSmoke
git checkout -b feature/my-feature
```

**Development Setup**
```bash
cd whiteSmoke

# Backend
cd Backend && npm install && npm run dev

# Frontend (in new terminal)
cd Frontend && npm install && npm run dev

# CLI (in new terminal)
cd CLI && npm install && npm run build
```

**Code Style**

- **TypeScript:** Use strict mode, no `any` types
- **Formatting:** Prettier with default config
- **Linting:** ESLint rules (to be added)
- **Naming:** camelCase for variables/functions, PascalCase for classes

Example:
```typescript
// Good
async function createWinePrefix(appId: string): Promise<string> {
  const prefixPath = path.join(HOME, '.whitesmoke/prefixes', appId);
  return prefixPath;
}

// Avoid
async function cwp(a) {
  return `/home/user/.ws/p/${a}`;
}
```

**Testing**

Add tests for new features:
```typescript
// tests/managers/myFeature.test.ts
describe('MyFeature', () => {
  test('should do something', async () => {
    expect(result).toBe(expected);
  });
});
```

Run tests:
```bash
npm run test          # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

**Commit Messages**

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(cli): add snapshot restore command
  ^^^^^    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  type    subject (lowercase)

- Add 'ws-cli restore <id> <snapshot-id>' command
- Integrate with new snapshot API
- Add documentation

Closes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Test additions
- `chore`: Maintenance, dependencies

**Create Pull Request**

```markdown
## Description
Brief description of changes

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
Describe your testing:
- Backend: `npm run test:backend`
- Frontend: `npm run test:frontend`
- Manual: Tested snapshot creation and restore

## Screenshots
If UI changes, add before/after

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No breaking changes
```

### Documentation Contributions

Improve docs by:
1. Fixing typos
2. Clarifying confusing sections
3. Adding examples
4. Creating tutorials

**Update README files:**
- **README.md**: High-level overview, getting started
- **Backend/README.md**: API documentation
- **Frontend/README.md**: Component library
- **CLI/README.md**: CLI commands
- **ROADMAP_FUTURE.md**: Planned features

**Create new guides:**
```markdown
# [Your Topic] Guide

## Overview
What this guide covers

## Prerequisites
Required knowledge or setup

## Step-by-Step
1. First step
2. Second step

## Examples
```bash
# Practical examples with output
```

## Troubleshooting
Common issues and solutions

## References
Related docs, links
```

### Translation Contributions

Help localize WhiteSmoke:

1. Create `src/i18n/translations/[language].json`:
```json
{
  "menu.file": "File",
  "menu.edit": "Edit",
  "app.title": "WhiteSmoke",
  "errors.notFound": "App not found"
}
```

2. Add to supported languages in config
3. Test in both directions

**Supported languages (planned):**
- English (en) ✅
- Spanish (es) ⏳
- French (fr) ⏳
- German (de) ⏳
- Russian (ru) ⏳
- Chinese (zh) ⏳

### Community Contributions (Non-Code)

Help in other ways:

**Testing & Bug Reports**
- Test on different hardware/OS
- Report edge cases
- Help reproduce issues

**Documentation & Tutorials**
- Write guides for specific games
- Create video tutorials
- Translate documentation

**Compatibility Database**
- Test games and report compatibility
- Document required setup steps
- Contribute to compatibility matrix

**Artwork & Design**
- Icon designs
- UI mockups
- Marketing materials

## Review Process

1. **Automated Checks**
   - Tests must pass
   - No lint errors
   - Coverage maintained

2. **Code Review**
   - At least 1 maintainer review
   - Feedback on code quality
   - Suggestions for improvement

3. **Approval & Merge**
   - Approved by maintainers
   - CI passed
   - Merged to main

## Merge Conflict Resolution

If your branch has conflicts:
```bash
git fetch origin
git rebase origin/main

# Resolve conflicts in editor
git add .
git rebase --continue
git push --force-with-lease
```

## Development Workflow

```
Issue Discussion
    ↓
Create Branch (feature/xyz)
    ↓
Implement Feature
    ↓
Add Tests & Docs
    ↓
Local Testing
    ↓
Push & Create PR
    ↓
Review & Feedback
    ↓
Approved → Merge to main
    ↓
Release Cycle
```

## Release Workflow

Maintainers follow this process:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v0.2.0`
4. Push tag: `git push --tags`
5. GitHub Actions creates release
6. Publish to npm registry

## Getting Help

- **Discussions**: GitHub Discussions for questions
- **Issues**: Bug reports and feature requests
- **Slack/Discord**: (Coming soon)
- **Email**: maintainers@whitesmoke.dev

## License

By contributing, you agree your work is licensed under MIT (same as WhiteSmoke).

---

## Recognition

Contributors will be recognized in:
- [CONTRIBUTORS.md](./CONTRIBUTORS.md)
- Release notes
- Project website

Thank you for making WhiteSmoke better! 🎉
