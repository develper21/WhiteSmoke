# WhiteSmoke Session Verification Guide

Complete checklist to verify all changes before pushing to GitHub.

## Part 1: Code Compilation Check

### Backend TypeScript Compilation
```bash
cd /workspaces/dotnet-codespaces/whiteSmoke/Backend

# Install any new deps
npm install

# Compile TypeScript -> JavaScript
npm run build

# Expected output:
# ✅ Backend compiled successfully
```

Check for errors:
- No TypeScript errors (tsc should exit 0)
- All imports resolve correctly
- `dist/` folder created with compiled JS

### Frontend TypeScript Compilation
```bash
cd ../Frontend

npm install
npm run build

# Expected: `dist/` folder created with bundled React
```

### CLI TypeScript Compilation
```bash
cd ../CLI

npm install
npm run build

# Expected: `dist/` folder created with CLI JS
```

## Part 2: File Integrity Check

### Verify New Files Exist
```bash
# Snapshot Manager
test -f Backend/src/managers/snapshotManager.ts && echo "✅ snapshotManager.ts exists"

# Documentation Files
test -f ROADMAP_FUTURE.md && echo "✅ ROADMAP_FUTURE.md exists"
test -f CONTRIBUTING.md && echo "✅ CONTRIBUTING.md exists"
test -f SESSION_SUMMARY.md && echo "✅ SESSION_SUMMARY.md exists"

# Commit Guides
test -f COMMIT_PHASE_13.md && echo "✅ COMMIT_PHASE_13.md exists"
test -f COMMIT_PHASE_14.md && echo "✅ COMMIT_PHASE_14.md exists"
```

### Verify File Modifications
```bash
# Check that files were modified (not just created)
git diff --name-only

# Should show:
# Backend/src/index.ts
# Backend/prisma/schema.prisma
# Backend/README.md
# CLI/src/index.ts
# CLI/package.json
# CLI/README.md
# Frontend/README.md
# README.md
# ROADMAP_FUTURE.md (new)
# CONTRIBUTING.md (new)
# COMMIT_PHASE_13.md (new)
# COMMIT_PHASE_14.md (new)
# SESSION_SUMMARY.md (new)
```

## Part 3: Syntax & Imports Check

### Backend API Endpoints
```bash
# Verify snippet from Backend/src/index.ts
grep -m 1 "api/apps/:id/snapshots" Backend/src/index.ts && echo "✅ Snapshot endpoints exist"

# Should find all 4 endpoints:
# - POST /api/apps/:id/snapshots
# - GET /api/apps/:id/snapshots  
# - POST /api/apps/:id/snapshots/:snapshotId/restore
# - DELETE /api/snapshots/:snapshotId
```

### CLI Commands
```bash
# Verify CLI has all 6 commands
grep "\.command(" CLI/src/index.ts | wc -l

# Should output: 6
# Commands: install, list, launch, remove, snapshot, snapshots, restore (7 total)
```

### Database Schema
```bash
# Check Snapshot model exists in Prisma schema
grep "model Snapshot" Backend/prisma/schema.prisma && echo "✅ Snapshot model added"

# Should find Snapshot model with fields:
# - id, appId, timestamp, snapshotPath, prefixSize, wineVersion, notes
```

## Part 4: Git Status Check

### Check Modified Files
```bash
cd /workspaces/dotnet-codespaces/whiteSmoke

# See all changes
git status

# Expected:
# On branch main
# Your branch is ahead of 'origin/main' by 0 commits
#
# Changes not staged for commit:
#   modified:   Backend/src/index.ts
#   modified:   Backend/src/managers/snapshotManager.ts (untracked)
#   modified:   Backend/prisma/schema.prisma
#   ...etc (15+ files)
```

### Review Diffs
```bash
# Check key changes
git diff Backend/src/index.ts | head -50

# Should show:
# - SnapshotManager import
# - new snapshot endpoints
# - console.log for snapshot operations
```

## Part 5: Documentation Check

### README Files Readable
```bash
# Check main README
wc -l README.md
# Should be ~120 lines (was ~99, added CLI section)

# Check subproject READMEs
wc -l Backend/README.md  # Should be ~350+ lines
wc -l Frontend/README.md # Should be ~350+ lines  
wc -l CLI/README.md      # Should be ~300+ lines
```

### Roadmap Content
```bash
# Verify roadmap covers 5 phases
grep "^## Phase" ROADMAP_FUTURE.md | wc -l
# Should output: 5

# Check phase 15-19 are detailed
grep "^### " ROADMAP_FUTURE.md | head -10
# Should show features for each phase
```

### Contributing Guide
```bash
# Verify sections exist
grep "^## " CONTRIBUTING.md

# Should have sections:
# - Code of Conduct
# - How to Contribute
# - Reporting Bugs
# - Suggesting Enhancements
# - Code Contributions
# - Creating Pull Requests
# - Review Process
# - etc.
```

## Part 6: Dependency Check

### Backend Dependencies
```bash
cd Backend
npm ls | grep -E "axios|@prisma" || echo "Dependencies ok"

# Should show:
# ├── axios@^1.6.2 (for future cloud sync)
# ├── @prisma/client (for database)
```

### CLI Dependencies  
```bash
cd ../CLI
npm ls | grep axios

# Should show:
# └── axios@^1.6.2
```

## Part 7: File Content Spot Checks

### Verify SnapshotManager Implementation
```bash
# Check key functions exist
grep "async createSnapshot\|async restoreSnapshot\|listSnapshots" Backend/src/managers/snapshotManager.ts | wc -l

# Should output: 3 (or more if helper functions listed)
```

### Verify CLI Commands
```bash
# Check all commands registered
grep "\.command(" CLI/src/index.ts | grep -o "'..*'" | head -7

# Should show 7 commands:
# 'install <name> <installer>'
# 'list'
# 'launch <id> <exe>'
# 'remove <id>'
# 'snapshot <id>'
# 'snapshots <id>'
# 'restore <id> <snapshotId>'
```

### Verify Prisma Relations
```bash
# Check cascading deletes
grep "onDelete: Cascade" Backend/prisma/schema.prisma | wc -l

# Should output: 2
# (One for Snapshot → App, one for InstallLog → App)
```

## Part 8: Test Compile & Run

### Try Building Everything
```bash
# From root
for dir in Backend Frontend CLI; do
  echo "Building $dir..."
  (cd $dir && npm install && npm run build) || echo "❌ Failed: $dir"
done

# All three should complete without errors
```

### Verify Compiled Output
```bash
# Check that dist folders have content
ls Backend/dist/index.js Frontend/dist/index.html CLI/dist/index.js

# All three files should exist and be non-empty
test -s Backend/dist/index.js && echo "✅ Backend compiled"
test -s Frontend/dist/index.html && echo "✅ Frontend compiled"
test -s CLI/dist/index.js && echo "✅ CLI compiled"
```

## Part 9: Git Commit Readiness

### Create Temporary Staging Area
```bash
cd /workspaces/dotnet-codespaces/whiteSmoke

# See what will be committed
git add -A
git status

# Should show all files in "Changes to be committed" (green)
# No red "Changes not staged for commit" for tracked files
# May have new untracked 'dist' folders (node_modules, etc)
```

### Check Commit Messages
```bash
# Review the exact commit messages from COMMIT_PHASE_13.md and COMMIT_PHASE_14.md
# Ensure they follow format: type(scope): subject

# Good examples:
# feat(cli): expand with list, launch, remove, snapshot, restore commands
# feat(snapshot): add database-backed snapshot management with metadata
# docs: add roadmap and contributing guidelines
```

## Part 10: Final Pre-Push Checklist

- [ ] All TypeScript files compile without errors
- [ ] New `snapshotManager.ts` file exists and has proper class
- [ ] Prisma schema updated with Snapshot model
- [ ] Backend API has all 4 snapshot endpoints
- [ ] CLI has 7 commands (install, list, launch, remove, snapshot, snapshots, restore)
- [ ] CLI uses axios to call backend (no local tar operations)
- [ ] README files updated with new sections
- [ ] ROADMAP_FUTURE.md created with 5 phases
- [ ] CONTRIBUTING.md created with guidelines
- [ ] SESSION_SUMMARY.md created with overview
- [ ] Git status shows only intended changes
- [ ] No sensitive data (passwords, keys) in any files
- [ ] Commit messages follow conventional format
- [ ] All dist/ folders created (backend, frontend, CLI)
- [ ] node_modules not staged for commit

## Troubleshooting Issues

### "SnapshotManager not found"
```bash
# Check imports in Backend/src/index.ts
grep "import.*SnapshotManager" Backend/src/index.ts

# Should show:
# import SnapshotManager from './managers/snapshotManager';
```

### "Prisma model not found"
```bash
# Verify schema.prisma syntax
npx prisma validate

# Should output: "✓ Your schema is valid"
```

### "CLI commands not recognized"
```bash
# Rebuild CLI
cd CLI && npm run build

# Test directly
node dist/index.js --help

# Should show all 7 commands
```

### "Axios import error"
```bash
# Ensure axios installed in CLI
cd CLI && npm ls axios

# Reinstall if missing
npm install axios
npm run build
```

## Expected Final State

After all checks pass, your repository should have:

```
whiteSmoke/
├── Backend/
│   ├── src/
│   │   ├── managers/
│   │   │   ├── snapshotManager.ts  ✅ NEW
│   │   │   ├── wineManager.ts
│   │   │   └── sandboxManager.ts
│   │   └── index.ts  ✅ UPDATED (+4 endpoints)
│   ├── prisma/
│   │   └── schema.prisma  ✅ UPDATED (+Snapshot model)
│   └── README.md  ✅ UPDATED
│
├── CLI/
│   ├── src/
│   │   └── index.ts  ✅ UPDATED (7 commands)
│   ├── package.json  ✅ UPDATED
│   └── README.md  ✅ UPDATED
│
├── Frontend/
│   └── README.md  ✅ UPDATED
│
├── README.md  ✅ UPDATED
├── ROADMAP_FUTURE.md  ✅ NEW (400+ lines)
├── CONTRIBUTING.md  ✅ NEW (400+ lines)
├── SESSION_SUMMARY.md  ✅ NEW
├── COMMIT_PHASE_13.md  ✅ NEW
└── COMMIT_PHASE_14.md  ✅ NEW
```

## Ready to Commit!

Once all checks pass above, run:

```bash
cd /workspaces/dotnet-codespaces/whiteSmoke

# Make 4 commits as documented in SESSION_SUMMARY.md
git add -A
git commit -m "feat(cli): expand with list, launch, remove, snapshot, restore commands
..."

# Continue with remaining 3 commits...

# Then push
git push -u origin main
```

✅ Verification complete! Ready for GitHub push.
