# Whitesmoke

A Linux‑only desktop application that hosts Windows applications in a managed, containerised compatibility environment.  
This repository contains the preliminary structure for the project; additional modules, services and documentation will be added as the implementation plan progresses.

## Overview

* **Shell**: Tauri (Rust) or Electron (Node) with a glass‑morphism design system.
* **Backend**:  Node.js (TypeScript) or Rust microservices for process and Wine/VM management.
* **Core**: shared types, helpers, compatibility database, mutation logic.
* **CLI**: command‑line companion for scripting installs, launching and snapshots.
* **Frontend**: React/Preact/Vue with TailwindCSS implementing the Liquid Glass UI.

Refer to the roadmap document for phase‑based development plans.

## Getting Started (development)

1. **Install prerequisites**:
   ```bash
   sudo apt update && sudo apt install -y wine64 wine32 docker.io podman \
     dpkg-dev appimagetool git curl
   # if you choose Rust backend / Tauri:
   curl https://sh.rustup.rs -sSf | sh -s -- -y
   ```
2. **Bootstrap the monorepo**:
   ```bash
   cd /workspaces/dotnet-codespaces/whiteSmoke
   npm run bootstrap
   ```
3. **Start backend**:
   ```bash
   cd Backend
   # install new deps (multer, prisma, etc.)
   npm install
   # generate Prisma client and run initial migration
   npx prisma generate
   npx prisma migrate dev --name init

   npm run dev
   # server listens on http://localhost:4000
   ```

The `/uploads` folder will store installer files; it is served statically by the backend for now.

### Sandbox & Resource Controls
A basic cgroup-based sandbox manager lives in `Backend/src/managers/sandboxManager.ts`.  When an app is installed a default limit (256 CPU shares, 1 GB RAM) is applied and you can adjust limits from the UI via the **Settings** button on each app tile.

Resource limits are sent to the `/api/apps/:id/limits` endpoint.

You can replicate a limit change with curl:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"cpuShares":512,"memoryMb":2048}' \
  http://localhost:4000/api/apps/<app-id>/limits
```

You must run the service as root or ensure `/sys/fs/cgroup/whitesmoke` is writable and mounted (requires cgroup v2).  For production the sandbox manager should create and manage namespaces or containers with Podman.

You can test upload with curl:
```bash
curl -F "installer=@/path/to/setup.exe" http://localhost:4000/api/upload
```

### Packaging & Desktop Shell

We use **Tauri** for the desktop wrapper; the `Frontend` subproject now includes a `src-tauri` directory with configuration.  To build the desktop application run:

```bash
# from Frontend folder
npm install            # ensure dependencies (including @tauri-apps/cli/api)
npm run tauri:dev      # launch dev app with embedded web UI
npm run tauri:build    # create distributables (.deb, AppImage, etc.)
```

The `tauri.conf.json` file defines bundle options (identifier, icons, dependencies) and the updater stub.  For initial builds you must have the Rust toolchain installed (`rustup` with `stable` target).  

Icons can be placed under `Frontend/src-tauri/icons` in appropriate sizes.  The `.deb` package will include a dependency on `wine` packages so they are installed on the host.

Customization of the Tauri window (dark mode, menus, tray, etc.) happens in `src-tauri/src/main.rs` which you can create after running `tauri init`.

The current UI includes a **dark / light mode toggle**; the preference is saved locally.  A real auto‑updater endpoint can be added by enabling the `updater` section and pointing to a release API (GitHub, custom server).

### Command-Line Interface

The **CLI** module provides comprehensive command-line management of applications, with support for installation, launching, snapshots, and restoration.

**Commands:**

```bash
# Build CLI
cd CLI && npm install && npm run build

# Install an application
ws-cli install "Notepad++" /path/to/notepad++.exe

# List all installed apps
ws-cli list

# Launch an installed app
ws-cli launch <app-id> notepad++.exe

# Create a snapshot (backup) of app state
ws-cli snapshot <app-id>

# Restore app from snapshot
ws-cli restore <app-id> ~/.whitesmoke/snapshots/Notepad++*.tar.gz

# Remove an app
ws-cli remove <app-id>

# Override API endpoint
WHITESMOKE_API=http://192.168.1.100:4000 ws-cli list
```

See [CLI/README.md](./CLI/README.md) for complete documentation and workflow examples.

4. **Start frontend** (in new terminal):
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

5. **Snapshot Workflow** (optional):
   ```bash
   # After backend is running:
   cd CLI
   npm install && npm run build
   
   # Create game backup before risky operations
   ws-cli snapshot <game-id>
   
   # Play & save progress ...
   
   # Restore if something breaks
   ws-cli restore <game-id> ~/.whitesmoke/snapshots/GameName-*.tar.gz
   ```

The implementation now supports persistent SQLite storage with Prisma ORM, installer detection, cgroup sandboxing, file uploads, and snapshot management. See [Backend/README.md](./Backend/README.md) for API documentation and [Frontend/README.md](./Frontend/README.md) for UI component library details.

