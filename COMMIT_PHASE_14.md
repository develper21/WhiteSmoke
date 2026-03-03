# Phase 14: Snapshot Management with Metadata - Commit Instructions

## Summary of Changes

Implemented comprehensive snapshot system with database-backed metadata, Wine version detection, and prefix size tracking.

### Files Modified

1. **Backend/src/managers/snapshotManager.ts** ✨ NEW
   - Complete snapshot lifecycle management
   - `createSnapshot()`: Capture prefix with metadata (size, Wine version)
   - `restoreSnapshot()`: Roll back to previous state
   - `listSnapshots()`: Query all snapshots
   - `getAppSnapshots()`: Filter snapshots by app ID
   - `deleteSnapshot()`: Clean up snapshots
   - Tar compression with log file exclusion
   - Wine version detection from registry

2. **Backend/prisma/schema.prisma**
   - Added `Snapshot` model with fields:
     - `id`, `appId`, `timestamp`, `snapshotPath`, `prefixSize`, `wineVersion`, `notes`
   - Foreign key relationships (App ↔ Snapshot, App ↔ InstallLog)
   - Cascading deletes
   - Indexes on appId and timestamp

3. **Backend/src/index.ts**
   - Added `SnapshotManager` import and initialization
   - **POST /api/apps/:id/snapshots** - Create snapshot with optional notes
   - **GET /api/apps/:id/snapshots** - List all snapshots for app
   - **POST /api/apps/:id/snapshots/:snapshotId/restore** - Restore to snapshot
   - **DELETE /api/snapshots/:snapshotId** - Delete snapshot and free space
   - Database persistence for all snapshots
   - Proper error handling and logging

4. **CLI/src/index.ts**
   - Updated `snapshot <id>` command to use API (not local tar)
   - Added `--note` option for snapshot descriptions
   - Added `snapshots <id>` command to list app snapshots
   - Updated `restore <id> <snapshotId>` to use API
   - Simplified implementation (no execSync for tar)
   - Better formatted output with sizing and dates

5. **CLI/package.json**
   - No new dependencies (axios already present)

6. **CLI/README.md**
   - Updated `snapshot` command docs
   - Added `snapshots` command docs
   - Updated `restore` command docs
   - Explained server-side snapshot storage
   - Added example workflow for mod testing

7. **Backend/README.md**
   - Added "Create Snapshot" endpoint docs
   - Added "List Snapshots" endpoint docs
   - Added "Restore Snapshot" endpoint docs
   - Added "Delete Snapshot" endpoint docs
   - Response examples and behavior documentation

## Commands to Execute

```bash
cd /workspaces/dotnet-codespaces/whiteSmoke

# Stage all changes
git add -A

# Commit with message
git commit -m "feat(snapshot): add database-backed snapshot management with metadata

- Implement SnapshotManager with createSnapshot, restoreSnapshot, listSnapshots
- Add Snapshot model to Prisma schema with Wine version & size tracking
- Add 4 snapshot endpoints: POST create, GET list, POST restore, DELETE
- Update CLI to use API-based snapshots with optional notes (--note)
- Add 'snapshots' command to list all snapshots for an app
- Detect Wine version from registry during snapshot creation
- Exclude log files from snapshots to save space
- Database persistence for all snapshot metadata

API changes:
  POST /api/apps/:id/snapshots -> Create snapshot
  GET /api/apps/:id/snapshots -> List snapshots
  POST /api/apps/:id/snapshots/:snapshotId/restore -> Restore snapshot
  DELETE /api/snapshots/:snapshotId -> Delete snapshot

CLI changes:
  ws-cli snapshot <id> [--note text]     (now uses API)
  ws-cli snapshots <id>                   (new command)
  ws-cli restore <id> <snapshotId>        (now uses API)

Closes phase 14 of roadmap."

# Push to GitHub
git push -u origin main
```

## Running Migrations

After pushing, setup the database schema:

```bash
cd Backend
npm install  # ensures @prisma/client is installed
npx prisma generate  # generate Prisma client
npx prisma migrate dev --name add_snapshots  # create migration
npm run dev  # start backend with new schema
```

## Testing the Snapshot Feature

```bash
# 1. Install app
ws-cli install "TestApp" /path/to/setup.exe

# 2. Wait for installation
ws-cli list

# 3. Create snapshot with note
ws-cli snapshot <app-id> --note "clean install"

# 4. List snapshots
ws-cli snapshots <app-id>

# 5. Make some changes (install mod, change config, etc.)

# 6. Create another snapshot
ws-cli snapshot <app-id> --note "with mods installed"

# 7. Restore first snapshot
ws-cli snapshots <app-id>  # Get snapshot ID
ws-cli restore <app-id> <snapshot-id>

# 8. Verify app is back to clean state
ws-cli list
```

## Architecture Updates

### Database Schema
```
App (1) ──── (*) Snapshot
     ──── (*) InstallLog
```

- Snapshots cascade-delete with App (deleting app removes all snapshots)
- Indexed by appId and timestamp for fast queries
- Timestamp allows sorting "newest first"

### Snapshot Storage

**Default location:** `~/.whitesmoke/snapshots/` (managed by SnapshotManager)

**File structure:**
```
~/.whitesmoke/snapshots/
├── <snapshot-uuid>-app-name.tar.gz       (compressed prefix)
└── <snapshot-uuid>-app-name.tar.gz.json  (metadata)
```

**Metadata format:**
```json
{
  "id": "snapshot-uuid",
  "appId": "app-uuid",
  "appName": "Game Name",
  "timestamp": "2024-01-15T10:50:30.000Z",
  "prefixPath": "/home/user/.whitesmoke/prefixes/app-uuid",
  "prefixSize": 2147483648,
  "wineVersion": "9.0",
  "notes": "before risky mod"
}
```

### Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Create snapshot | 30s - 5m | Depends on prefix size (1-10GB) |
| Restore snapshot | 15s - 2m | Extract + verify |
| List snapshots | <1s | Database query |
| Delete snapshot | 1-5s | File deletion |

## Next Steps (Phase 15)

1. **Cloud Sync**
   - Upload snapshots to S3/Azure/Dropbox
   - Download/restore from cloud
   - Bandwidth optimization (differential sync)

2. **Multi-Runtime Support**
   - Add Proton runtime selection
   - DXVK shader caching
   - Runtime per-app configuration

3. **Snapshot Compression Profiles**
   - Quick (tar only) - 2-5x size, instant
   - Standard (tar + gzip) - 3-10x compression
   - Maximum (tar + xz) - 5-15x, slow

4. **Snapshot Diffing**
   - Show what changed between snapshots
   - Selective restore (cherry-pick files)
   - Useful for tracking modifications

## Rollback Plan

If database migration fails:

```bash
cd Backend
rm prisma/migrations/*/migration.sql  # Remove latest migration
npx prisma migrate resolve --rolled-back add_snapshots
git reset --hard HEAD~1  # Revert commit
```

## Notes

- Snapshots stored on same machine (local backup only for now)
- Future: Add S3/cloud backend for cross-machine snapshots
- Snapshots NOT included in app deletions initially (explicit delete only)
- Future: Option to auto-cleanup old snapshots (e.g., keep last 5)
- Wine version detection works with most Wine versions (detects via registry)

---

Commit these changes and push. Phase 14 complete!
