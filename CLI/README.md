# WhiteSmoke CLI

Command-line interface for managing Wine prefixes and Windows applications on Linux.

## Installation

```bash
cd CLI
npm install
npm run build
npm start -- --help
```

Or globally:

```bash
npm install -g .
ws-cli --help
```

## Commands

### `install <name> <installer>`

Install a Windows application.

```bash
# Install from path
ws-cli install "Notepad++" /path/to/notepad++.exe
ws-cli install "Adobe Reader" /path/to/AdobeReader.msi

# Check status
ws-cli list
```

**Behavior:**
- Creates a new Wine prefix
- Runs the installer with appropriate flags (quiet mode for MSI)
- Stores metadata in SQLite database
- Applies default sandbox limits (1GB RAM, low CPU share)

### `list`

Show all installed applications.

```bash
ws-cli list
```

**Output:**
```
📦 Installed Apps:

✅ Notepad++
   ID: 12345-abcd-...
   Status: Installed
   Launches: 5
   Created: 12/31/2024

⏳ Adobe Reader
   ID: 67890-efgh-...
   Status: Installing
   Launches: 0
   Created: 12/31/2024
```

### `launch <id> <exe>`

Run an installed application.

```bash
# Launch with exe name
ws-cli launch 12345-abcd-... notepad++.exe

# Full path also works
ws-cli launch 12345-abcd-... ~/.whitesmoke/prefixes/12345-abcd-/drive_c/Program\ Files/Notepad++/notepad++.exe
```

**Behavior:**
- Verifies app is installed before launching
- Updates last launch time and launch counter
- Runs in applicaton's Wine prefix with resource limits

### `remove <id>`

Delete an installed application and its Wine prefix.

```bash
ws-cli remove 12345-abcd-...
```

**Behavior:**
- Removes the Wine prefix directory
- Deletes database records and install logs
- Cleans up cgroup limits

### `snapshot <id>` [--note <text>]

Create a compressed archive of an application's Wine prefix.

```bash
ws-cli snapshot 12345-abcd-...
ws-cli snapshot 12345-abcd-... --note "before attempting risky mod"
```

**Output:**
```
✅ Snapshot created: <snapshot-id>
   Size: 2048 MB
   Path: 2024-01-15T10:50:30.000Z
```

**Storage:**
- Snapshots stored server-side (location configurable per deployment)
- Metadata recorded in database with optional notes
- Full Wine prefix state captured (registry, files, DLLs)
- Excludes log files to save space

### `snapshots <id>`

List all snapshots for an application.

```bash
ws-cli snapshots 12345-abcd-...
```

**Output:**
```
📸 Snapshots:

📦 <snapshot-id-1>
   Date: 1/15/2024, 10:50:30 AM
   Size: 2048 MB
   Notes: before attempting risky mod

📦 <snapshot-id-2>
   Date: 1/14/2024, 3:20:15 PM
   Size: 2048 MB
```

### `restore <id> <snapshot-id>`

Restore an application from a snapshot.

```bash
ws-cli snapshots 12345-abcd-...  # Get snapshot ID
ws-cli restore 12345-abcd-... <snapshot-id>
```

**Output:**
```
🔄 Restoring snapshot...
✅ Snapshot restored: snapshot restored
```

**Behavior:**
- Replaces current prefix with snapshot version
- Preserves app metadata and location
- Restores all registry changes, installed DLLs, configs

## Options

### `--api <url>` or `-a <url>`

Override backend API URL (default: `http://localhost:4000`)

```bash
WHITESMOKE_API=http://192.168.1.100:4000 ws-cli list
ws-cli --api http://192.168.1.100:4000 list
```

## Environment Variables

- `WHITESMOKE_API`: Backend API endpoint (default: `http://localhost:4000`)
- `HOME`: Snapshot directory location (default: `$HOME/.whitesmoke/snapshots`)

## Workflow Examples

### Basic Installation & Launch

```bash
# 1. Install from ISO or downloaded file
ws-cli install "Civilization VI" ~/Downloads/CivVI.exe

# 2. Wait for installation to complete
# Monitor with: ws-cli list

# 3. Once installed, launch the app
ws-cli list  # Get the app ID
ws-cli launch <id> Civ6.exe
```

### Snapshot & Restore (Game Save Management)

```bash
# 1. Play game, save progress
ws-cli launch <game-id> game.exe

# 2. Create snapshot of game + saves
ws-cli snapshot <game-id>

# 3. If game gets corrupted, restore
ws-cli restore <game-id> ~/.whitesmoke/snapshots/GameName-*.tar.gz

# 4. Play again
ws-cli launch <game-id> game.exe
```

### Multi-Version Management

```bash
# Install multiple versions of same app
ws-cli install "Office 2019" ~/office2019.msi
ws-cli install "Office 365" ~/office365.msi

# Snapshot each version
ws-cli snapshot <office2019-id>
ws-cli snapshot <office365-id>

# Switch between them by restoring snapshots
ws-cli restore <office2019-id> ~/.whitesmoke/snapshots/Office2019-*.tar.gz
ws-cli restore <office365-id> ~/.whitesmoke/snapshots/Office365-*.tar.gz
```

### Cleanup

```bash
# List all apps
ws-cli list

# Remove app you no longer want
ws-cli remove <id>

# Manual cleanup of old snapshots
rm ~/.whitesmoke/snapshots/OldApp-*.tar.gz
```

## Architecture

The CLI communicates with the WhiteSmoke Backend API running on `localhost:4000`:

- **POST /api/install**: Create new app & prefix
- **GET /api/apps**: List all apps
- **GET /api/apps/:id**: Get single app details
- **POST /api/launch**: Run executable in prefix
- **DELETE /api/apps/:id**: Remove app & clean up
- **POST /api/apps/:id/limits**: Configure CPU/memory sandbox

Snapshots are stored locally as `.tar.gz` files (full prefix compression).

## Troubleshooting

### `❌ Failed to list apps: ECONNREFUSED`
Backend not running. Start with:
```bash
cd Backend
npm install
npm run start
```

### `❌ Installer not found: /path/to/...`
Check installer file exists and path is correct:
```bash
ls -la /path/to/installer.exe
```

### `❌ App not yet installed`
Installation is still in progress. Check status:
```bash
ws-cli list
```

### Snapshot too large
Wine prefixes can be 1-10GB. Ensure enough disk space:
```bash
df -h ~/.whitesmoke/snapshots/
```

## Performance Notes

- **Installation:** 5-30 minutes depending on app size
- **Snapshot:** ~30 seconds per GB (tar + gzip)
- **Restore:** ~15 seconds per GB (decompress)
- **Launch:** 2-5 seconds (Wine prefix initialization)
- **Memory per app:** Default 1GB, configurable via Backend API

## License

MIT (same as WhiteSmoke)
