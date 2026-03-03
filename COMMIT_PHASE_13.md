# Phase 13: CLI Expansion - Commit Instructions

## Summary of Changes

Expanded the WhiteSmoke CLI from minimal scaffold to full-featured command suite:

### Files Modified

1. **CLI/src/index.ts**
   - Replaced basic `install` command with comprehensive yargs setup
   - Added 5 new commands: `list`, `launch`, `snapshot`, `restore`, `remove`
   - Integrated axios for Backend API communication
   - Added snapshot storage to `~/.whitesmoke/snapshots/`
   - Proper error handling and user-friendly output

2. **CLI/package.json**
   - Added `axios` dependency for HTTP requests
   - Added `@types/node` to devDependencies

3. **CLI/README.md** ✨ NEW
   - Complete CLI documentation
   - All commands with examples
   - Workflow use cases (game saves, multi-version management)
   - Troubleshooting guide

4. **Backend/README.md** ✨ NEW
   - API endpoint documentation (GET, POST, DELETE)
   - Database schema explanation
   - Manager functions (Wine, Sandbox, InstallerDetector)
   - cURL examples
   - Deployment guide

5. **Frontend/README.md** ✨ NEW
   - Component library documentation (7 glass components)
   - Theme system explanation
   - Tauri integration guide
   - Tailwind configuration
   - Development workflow

6. **README.md** (root)
   - Added comprehensive CLI section
   - Updated getting started with snapshot workflow
   - Links to subproject READMEs

## Commands to Execute

```bash
cd /workspaces/dotnet-codespaces/whiteSmoke

# Stage all changes
git add -A

# Commit with message
git commit -m "feat(cli): expand with list, launch, remove, snapshot, restore commands

- Add comprehensive yargs CLI with 5 new commands (list, launch, snapshot, restore, remove)
- Integrate axios for Backend API communication  
- Snapshot support: tar-based Wine prefix backup/restore to ~/.whitesmoke/snapshots/
- Add CLI, Backend, and Frontend README documentation
- Update root README with CLI usage examples and workflow docs

Commands now support full app lifecycle:
  ws-cli install <name> <installer>
  ws-cli list [--api URL]
  ws-cli launch <id> <exe>
  ws-cli snapshot <id>
  ws-cli restore <id> <snapshot-path>
  ws-cli remove <id>

Closes phase 13 of roadmap."

# Push to GitHub
git push -u origin main
```

## Testing Instructions (for user)

After pushing, test locally:

```bash
# 1. Install deps and build CLI
cd CLI && npm install && npm run build

# 2. Start backend (if not running)
# In one terminal:
cd Backend && npm install && npm run dev

# 3. Test CLI commands
node dist/index.js list
node dist/index.js install "Test App" /path/to/test.exe
node dist/index.js list  # Check status
node dist/index.js snapshot <app-id>
node dist/index.js list  # Verify snapshot created
```

## What's Ready for Next Phase (14)

1. **Snapshot File Format**
   - Currently: `.tar.gz` of Wine prefix directory
   - Ready to add: JSON metadata (game config, installed mods, etc.)

2. **Multi-Runtime Support**
   - Wine (current): Works
   - Proton: Can add via PROTONPATH environment variable
   - (Future: Custom runtime selection per app)

3. **Cloud Sync** (Phase 15)
   - Snapshots can be uploaded to cloud storage
   - Need: S3 / Dropbox integration endpoint

4. **Testing** (Phase 16)
   - Jest unit tests for managers
   - React Testing Library for components
   - GitHub Actions test job

## Architecture Status

✅ **Complete:**
- Backend API (all CRUD endpoints)
- Database (Prisma + SQLite)
- Wine/cgroups managers
- Installer detection
- Frontend UI + theme system
- Tauri packaging config
- CLI with snapshot support
- GitHub Actions CI

⏳ **In Progress:**
- CLI build test (user to run)
- Snapshot format enhancement

❌ **Not Started:**
- Multi-runtime management
- Cloud sync
- Comprehensive test suite

## Notes

- CLI uses environment variable `WHITESMOKE_API` to override backend URL
- Snapshots stored in user's home directory (not system-wide)
- Tar format used for portability (works on all Unix-like systems)
- Future phase: Add snapshot encryption/compression profiles

---

Run the commit and push commands above, then proceed to Phase 14 (Multi-Runtime & Snapshot Enhancements).
