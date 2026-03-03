# WhiteSmoke Backend API

REST API for managing Wine prefixes, app installation, launching, and sandboxing.

## Server Setup

```bash
cd Backend
npm install
npm run build
npm run dev  # or npm start for production
```

Server runs on `http://localhost:4000` by default. Set `PORT` environment variable to override.

## Architecture

- **Express.js** REST server
- **Prisma ORM** with SQLite database
- **Multer** for file uploads
- **Custom managers** for Wine, sandbox (cgroups), installer detection

## Database

Initialize the database:

```bash
# Generate Prisma client
npx prisma generate

# Create or update schema
npx prisma migrate dev --name init

# View/edit database in browser
npx prisma studio
```

Database file: `.env` should declare `DATABASE_URL=file:./app.db`

### Schema

**App Table:**
- `id` (UUID): Unique identifier
- `name` (String): Display name
- `prefixPath` (String): Wine prefix location
- `installerPath` (String): Path to installer on disk
- `installed` (Boolean): Installation state
- `launchCount` (Int): Number of times launched
- `lastLaunch` (DateTime): Last execution time
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last modified timestamp

**InstallLog Table:**
- `id` (UUID): Log entry ID
- `appId` (UUID): Reference to App
- `message` (String): Log message
- `timestamp` (DateTime): When logged

## API Endpoints

### Health Check

**GET /health**

Simple liveness probe.

```bash
curl http://localhost:4000/health
# {"status":"ok"}
```

### Installation

**POST /api/install**

Start installation of a Windows application.

**Request:**
```json
{
  "name": "Notepad++",
  "installerPath": "/home/user/Downloads/npp.exe"
}
```

**Response:**
```json
{
  "id": "12345-abcd-...",
  "message": "installation started"
}
```

**Notes:**
- Installation runs asynchronously in background
- Default sandbox limits applied (1GB RAM, 256 CPU shares)
- `installed` field updated to `true` when complete

### List Apps

**GET /api/apps**

Fetch all installed applications.

**Query Parameters:**
- `limit` (optional): Number of results (default: all)
- `offset` (optional): Pagination offset

**Response:**
```json
[
  {
    "id": "12345-abcd-...",
    "name": "Notepad++",
    "prefixPath": "/home/user/.whitesmoke/prefixes/12345-abcd-...",
    "installerPath": "/home/user/Downloads/npp.exe",
    "installed": true,
    "launchCount": 5,
    "lastLaunch": "2024-12-31T15:30:00.000Z",
    "createdAt": "2024-12-15T10:00:00.000Z",
    "updatedAt": "2024-12-31T15:30:00.000Z"
  }
]
```

### Get Single App

**GET /api/apps/:id**

Fetch details of a specific application.

**Response:**
```json
{
  "id": "12345-abcd-...",
  "name": "Notepad++",
  "prefixPath": "...",
  "installed": true,
  ...
}
```

**Errors:**
- **404**: App not found

### Launch App

**POST /api/launch**

Execute an installed application.

**Request:**
```json
{
  "id": "12345-abcd-...",
  "exe": "notepad++.exe"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "app launched"
}
```

**Behavior:**
- Increments `launchCount`
- Updates `lastLaunch` timestamp
- Runs in app's Wine prefix with cgroup limits
- Returns immediately (async execution)

**Errors:**
- **404**: App not found
- **400**: App not yet installed

### Set Resource Limits

**POST /api/apps/:id/limits**

Configure CPU, memory, and PID limits via cgroups.

**Request:**
```json
{
  "cpuShares": 512,
  "memoryMb": 2048,
  "pids": 1000
}
```

**Response:**
```json
{
  "ok": true
}
```

**Defaults:**
- `cpuShares`: 256 (out of 1024)
- `memoryMb`: 1024 (1 GB)
- `pids`: 512

**Notes:**
- Requires root or cgroup v2 with writable `/sys/fs/cgroup/whitesmoke`
- Changes apply to process while app is running

### Get Install Logs

**GET /api/logs/:appId**

Fetch installation and execution logs for an app.

**Response:**
```json
[
  {
    "id": "log-uuid",
    "appId": "app-uuid",
    "message": "prefix created at /path/...",
    "timestamp": "2024-12-15T10:00:30.000Z"
  }
]
```

### Delete App

**DELETE /api/apps/:id**

Remove an app and its Wine prefix.

**Response:**
```json
{
  "ok": true,
  "message": "app deleted",
  "app": {
    "id": "12345-abcd-...",
    "name": "Notepad++",
    ...
  }
}
```

**Behavior:**
- Deletes Wine prefix directory
- Removes app record from database
- Deletes all associated logs
- Cleans up cgroup configuration

### Create Snapshot

**POST /api/apps/:id/snapshots**

Create a backup of an app's Wine prefix.

**Request:**
```json
{
  "notes": "optional descriptive text"
}
```

**Response:**
```json
{
  "ok": true,
  "snapshot": {
    "id": "snapshot-uuid",
    "appId": "app-uuid",
    "appName": "Notepad++",
    "timestamp": "2024-12-31T15:30:00.000Z",
    "prefixSize": 2147483648,
    "wineVersion": "9.0",
    "notes": "optional descriptive text"
  }
}
```

**Behavior:**
- Captures entire Wine prefix as tar.gz
- Records metadata (size, Wine version, timestamp)
- Stores snapshot on server (location via SnapshotManager)
- Excludes log files to minimize size
- Returns in ~5-30 seconds depending on prefix size

### List Snapshots

**GET /api/apps/:id/snapshots**

Fetch all snapshots for an application.

**Response:**
```json
[
  {
    "id": "snapshot-uuid",
    "appId": "app-uuid",
    "timestamp": "2024-12-31T15:30:00.000Z",
    "snapshotPath": "/path/to/snapshot.tar.gz",
    "prefixSize": 2147483648,
    "wineVersion": "9.0",
    "notes": "before risky mod install"
  }
]
```

### Restore Snapshot

**POST /api/apps/:id/snapshots/:snapshotId/restore**

Roll back app to a previous snapshot state.

**Response:**
```json
{
  "ok": true,
  "message": "snapshot restored"
}
```

**Behavior:**
- Replaces current prefix with snapshot version
- Preserves app metadata (name, ID)
- Takes ~5-20 seconds depending on size
- Previous state is overwritten (no rollback possible)

**Notes:**
- Consider creating new snapshot before dangerous operations
- Useful for game saves, mod testing, config rollback

### Delete Snapshot

**DELETE /api/snapshots/:snapshotId**

Remove a snapshot and free disk space.

**Response:**
```json
{
  "ok": true,
  "message": "snapshot deleted"
}
```

**Behavior:**
- Deletes tar.gz file from disk
- Removes metadata from database
- Frees up storage space

## File Upload

**POST /api/upload**

Upload and validate an installer file.

**Request:** (multipart/form-data)
- `installer`: Binary file (EXE or MSI)

**Response:**
```json
{
  "type": "exe",
  "path": "/uploads/12345-file.exe"
}
```

**Validation:**
- Magic number checking (MZ header for EXE, OLE for MSI)
- File type inference

**Errors:**
- **400**: No file provided or invalid type

## Managers

### WineManager

Functions in `src/managers/wineManager.ts`:

- `createPrefix(prefixId)`: Initialize Wine prefix directory
- `installExe(prefixPath, installerPath)`: Run EXE with quiet flags
- `runExe(prefixPath, exePath)`: Execute program in prefix
- `installMsi(prefixPath, msiPath)`: Run MSI with silent flags

All functions return Promises and support error handling.

### SandboxManager

Functions in `src/managers/sandboxManager.ts`:

- `applyLimits(appId, config)`: Set CPU/memory/PID limits via cgroups
- `addPid(appId, pid)`: Add process to cgroup
- `removeCgroup(appId)`: Clean up cgroup on app deletion

Requires cgroup v2 and root privileges (or cgroup writable by user).

### InstallerDetector

Functions in `src/services/installerDetector.ts`:

- `detectInstallerType(filePath)`: Analyze file and return type + flags
- `getInstallFlags(type)`: Return appropriate flags (quiet, silent, etc.)

Uses magic number validation:
- EXE: `MZ` header (4D 5A)
- MSI: OLE compound document

## Error Handling

All endpoints return JSON with consistent error format:

```json
{
  "error": "short error message"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (missing fields, invalid state)
- `404`: Resource not found
- `500`: Server error

## Database Queries

Using Prisma Client in application code:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Find all
const apps = await prisma.app.findMany();

// Find one
const app = await prisma.app.findUnique({ where: { id } });

// Create
const newApp = await prisma.app.create({
  data: { name, prefixPath, installerPath }
});

// Update
await prisma.app.update({
  where: { id },
  data: { installed: true }
});

// Delete
await prisma.app.delete({ where: { id } });
```

## Development Tips

1. **Run migrations on DB changes:**
   ```bash
   npx prisma migrate dev --name <name>
   ```

2. **View SQLite database:**
   ```bash
   npx prisma studio  # Opens browser UI
   # or use command line:
   sqlite3 app.db
   sqlite> SELECT * FROM App;
   ```

3. **Test endpoints with curl:**
   ```bash
   curl -X POST http://localhost:4000/api/install \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","installerPath":"/tmp/test.exe"}'
   ```

4. **Watch for TypeScript errors:**
   ```bash
   npm run build  # compile
   npm run lint   # check (if eslint added)
   ```

5. **Enable debug logging:**
   ```bash
   DEBUG=whitesmoke:* npm run dev
   ```

## Deployment

For production:

1. Set `NODE_ENV=production`
2. Use managed database (PostgreSQL) instead of file-based SQLite
3. Run with PM2 or systemd service
4. Use reverse proxy (nginx) for HTTPS and load balancing
5. Set cgroup v2 limits at container/systemd unit level
6. Configure Wine & Proton paths via environment variables

Example systemd service:

```ini
[Unit]
Description=WhiteSmoke Backend
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/node /opt/whitesmoke/Backend/dist/index.js
Environment="NODE_ENV=production"
Environment="PORT=4000"
Environment="DATABASE_URL=postgresql://..."
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## License

MIT
