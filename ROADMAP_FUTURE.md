# WhiteSmoke Project Roadmap - Phases 15-19

Extended roadmap with security, cloud, testing, and containerization strategies.

## Phase 15: Cloud Sync & Backup (Estimated: 3-4 weeks)

**Goal:** Enable snapshot synchronization to cloud storage and multi-device app management.

### Features

**S3/Azure Blob Storage Backend**
```typescript
// SnapshotManager extension
async uploadSnapshot(snapshotId: string, bucket: string): Promise<void>
async downloadSnapshot(appId: string, snapshotId: string): Promise<string>
async listRemoteSnapshots(appId: string): Promise<SnapshotMetadata[]>
```

**Sync Strategy**
- Differential uploads (skip unchanged files)
- Bandwidth throttling (configurable rate limit)
- Background sync with progress tracking
- Conflict resolution (local vs cloud version)

**API Endpoints**
```
POST   /api/snapshots/:id/upload       - Push to cloud
GET    /api/snapshots/:id/download     - Pull from cloud
GET    /api/apps/:id/cloud-snapshots   - List remote backups
POST   /api/sync/status                - Check sync state
DELETE /api/snapshots/:id/cloud        - Remove from cloud only
```

**Configuration**
```env
SNAPSHOT_STORAGE=local|s3|azure
AWS_S3_BUCKET=whitesmoke-backups
AWS_REGION=us-east-1
AZURE_STORAGE_ACCOUNT=...
AZURE_CONTAINER=snapshots
```

**Database Extension**
```prisma
model SnapshotSync {
  id String @id
  snapshotId String
  snapshot Snapshot @relation(fields: [snapshotId])
  
  storageBackend String  // s3, azure, etc
  remotePath String      // s3://bucket/path/...
  syncedAt DateTime
  localHash String       // for verification
  remoteHash String
  status String          // synced, pending, failed
}
```

### CLI Commands

```bash
# Upload snapshot to configured cloud storage
ws-cli push <snapshot-id> --cloud s3

# Download snapshot from cloud
ws-cli pull <app-id> <snapshot-id>

# Sync all snapshots for app
ws-cli sync <app-id> --cloud

# List remote snapshots
ws-cli snapshots <app-id> --remote

# Restore from cloud directly (without local copy)
ws-cli restore <app-id> --cloud <snapshot-id>
```

### Testing
- S3 moto mocks for unit tests
- Azure emulator testing
- Bandwidth throttle tests
- Conflict resolution scenarios

---

## Phase 16: Testing & CI/CD Expansion (Estimated: 3 weeks)

**Goal:** Comprehensive test coverage and automated quality checks.

### Backend Testing

**Jest Unit Tests**
```typescript
// tests/managers/wineManager.test.ts
describe('WineManager', () => {
  test('createPrefix creates valid Wine directory', async () => {
    const prefix = await createPrefix('test-id');
    expect(fs.existsSync(prefix)).toBe(true);
  });
  
  test('installExe handles missing file gracefully', async () => {
    await expect(installExe('/path', '/missing.exe')).rejects.toThrow();
  });
});

// tests/managers/snapshotManager.test.ts
describe('SnapshotManager', () => {
  test('createSnapshot captures metadata', async () => {
    const meta = await snapshotMgr.createSnapshot(...);
    expect(meta.prefixSize).toBeGreaterThan(0);
    expect(meta.wineVersion).toBeTruthy();
  });
});

// tests/services/installerDetector.test.ts
describe('InstallerDetector', () => {
  test('detects .exe files correctly', () => {
    const type = detectInstallerType('game.exe');
    expect(type.type).toBe('exe');
  });
});
```

**API Integration Tests**
```typescript
describe('POST /api/install', () => {
  test('creates app record and starts installation', async () => {
    const res = await request(app)
      .post('/api/install')
      .send({ name: 'Test', installerPath: '/test.exe' });
    
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
  });
});
```

### Frontend Testing

**React Testing Library**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import GlassButton from '../components/GlassButton';

describe('GlassButton', () => {
  test('renders with correct text', () => {
    render(<GlassButton>Click me</GlassButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  test('calls onClick handler', () => {
    const handleClick = jest.fn();
    render(<GlassButton onClick={handleClick}>Click</GlassButton>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### GitHub Actions CI/CD Enhancement

**Matrix Testing**
```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, ubuntu-22.04]
        node: [18, 20]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm run test:unit
      - run: npm run test:integration
```

**Coverage Reports**
```yaml
- run: npm run test:coverage
- uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

**Release Automation**
```yaml
- name: Create Release
  uses: ncipollo/release-action@v1
  with:
    artifacts: "Backend/dist/**,Frontend/dist/**"
    generateReleaseNotes: true
    skipIfReleaseExists: true
```

### Test Coverage Goals

- Backend: >80% coverage
- Frontend: >70% coverage
- Critical paths: 100% coverage

---

## Phase 17: Security Hardening (Estimated: 4 weeks)

**Goal:** Implement sandboxing, AppArmor profiles, and malware detection.

### Namespace Isolation

**Linux Namespaces**
```typescript
// src/managers/namespaceManager.ts
async function runInNamespace(appId: string, exePath: string): Promise<void> {
  // PID namespace: process isolation
  // Network namespace: network isolation
  // Mount namespace: filesystem isolation
  // IPC namespace: inter-process communication isolation
  
  const child = spawn('unshare', [
    '--pid=self',
    '--mount=self',
    '--ipc=self',
    'wine', exePath
  ]);
}
```

**Podman Container Fallback**
```typescript
async function runInPodman(appId: string, exePath: string): Promise<void> {
  const container = await podman.containers.create({
    Image: 'whitesmoke-wine-base',
    Cmd: ['wine', exePath],
    HostConfig: {
      MemoryLimit: 1073741824,
      CpuShares: 256,
    },
    Mounts: [{
      Type: 'bind',
      Source: prefixPath,
      Target: '/prefix',
    }],
  });
  
  await container.start();
}
```

### AppArmor Profiles

**Profile for Wine Apps**
```apparmor
#include <tunables/global>

profile whitesmoke-wine flags=(attach_disconnected) {
  #include <abstractions/base>
  #include <abstractions/nameservice>
  
  /opt/wine/bin/** ix,
  /home/*/.whitesmoke/** r,
  /home/*/.whitesmoke/prefixes/** rwk,
  
  # Deny direct system access
  deny /usr/bin/** x,
  deny /etc/** r,
  deny /sys/** r,
  deny /proc/sys/** r,
  
  # Allow Wine runtime
  /home/*/.cache/wine/** rw,
  /tmp/** rw,
}
```

**Load Profile**
```bash
sudo apparmor_parser -r /etc/apparmor.d/whitesmoke-wine
```

### Malware Detection

**ClamAV Integration**
```typescript
// src/services/malwareScanner.ts
import NodeClam from 'clamscan';

const clamscan = await new NodeClam().init({
  clamdscan: { host: 'localhost', port: 3310 },
});

async function scanInstaller(filePath: string): Promise<boolean> {
  const { isInfected, viruses } = await clamscan.scanFile(filePath);
  
  if (isInfected) {
    console.warn(`⚠️ Malware detected: ${viruses}`);
    return false;
  }
  return true;
}
```

**API Integration**
```
POST /api/scan/<installer-path>
Response: { infected: false, viruses: [] }
```

### Secret Management

**Azure Key Vault / HashiCorp Vault**
```typescript
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

const credential = new DefaultAzureCredential();
const client = new SecretClient(
  `https://${process.env.VAULT_NAME}.vault.azure.net`,
  credential
);

const databasePassword = await client.getSecret('database-password');
```

**Environment Variable Encryption**
```bash
# During deployment
openssl enc -aes-256-cbc -S $(openssl rand -hex 8) \
  -in .env.local -out .env.local.enc -k "$SECRET"
```

### Audit Logging

**Structured Logs**
```typescript
// src/services/auditLogger.ts
interface AuditEvent {
  timestamp: string;
  action: 'install' | 'launch' | 'snapshot' | 'delete';
  appId: string;
  userId?: string;
  ip?: string;
  status: 'success' | 'failure';
  details?: object;
}

async function logAudit(event: AuditEvent): Promise<void> {
  await prisma.auditLog.create({ data: event });
  console.log(`[AUDIT] ${event.action} on ${event.appId}: ${event.status}`);
}
```

**Database Model**
```prisma
model AuditLog {
  id String @id @default(cuid())
  timestamp DateTime @default(now())
  action String
  appId String
  userId String?
  status String
  details Json?
  ipAddress String?
  
  @@index([timestamp])
  @@index([appId])
  @@index([userId])
}
```

---

## Phase 18: Multi-Runtime Support (Estimated: 3 weeks)

**Goal:** Support Proton, Lutris runners, and custom Wine variants.

### Runtime Configuration

**Runtime Model**
```prisma
model WineRuntime {
  id String @id
  name String           // "Wine 9.0", "Proton 8.15", etc.
  type String           // wine, proton, lutris
  version String
  basePath String       // /opt/wine, /opt/proton, etc.
  isDefault Boolean
  
  createdAt DateTime @default(now())
  apps App[]
}

// Update App model
model App {
  ...
  runtimeId String?
  runtime WineRuntime? @relation(fields: [runtimeId])
}
```

**Runtime Detection**
```typescript
// src/services/runtimeDetector.ts
async function detectRuntimes(): Promise<WineRuntime[]> {
  const runtimes: WineRuntime[] = [];
  
  // Check system Wine
  const wineVersion = await execAsync('wine --version');
  runtimes.push({
    name: `Wine ${wineVersion}`,
    type: 'wine',
    basePath: '/usr/bin',
  });
  
  // Check Proton (Steam)
  if (fs.existsSync(`${HOME}/.steam/root/compatibilitytools.d`)) {
    // Parse Proton versions
  }
  
  // Check Lutris runners
  if (fs.existsSync(`${HOME}/.cache/lutris/runners`)) {
    // Parse runner directories
  }
  
  return runtimes;
}
```

**Switchable Runtimes**
```bash
# CLI command
ws-cli runtimes                    # List available
ws-cli use-runtime <id> <app-id>  # Set for app

# API
GET  /api/runtimes                 # List
GET  /api/runtimes/:id            # Details
POST /api/apps/:id/runtime         # Set runtime
```

### DXVK/VKD3D Shader Cache

```typescript
// src/managers/dxvkManager.ts
interface DXVKConfig {
  dxvkHud: string;      // 'fps|memory|api'
  dxvkAsyncShaders: boolean;
  dxvkCacheSize: number; // MB
}

async function applyDXVKSettings(
  prefixPath: string,
  config: DXVKConfig
): Promise<void> {
  const regPath = path.join(prefixPath, 'drive_c/windows/system32');
  // Modify dxvk.conf
  // Write registry entries
}
```

---

## Phase 19: Advanced Features (Estimated: 4 weeks)

**Goal:** Installer cache, dependency management, and mod support.

### Installer Cache

**Caching Windows Redistributables**
```typescript
// Auto-download and cache
const RedistCache = {
  'vcrun2022': 'https://download.microsoft.com/...',
  'dotnet48': 'https://download.microsoft.com/...',
  'dxrun': 'https://download.microsoft.com/...',
};

async function installRedist(name: string, prefix: string): Promise<void> {
  const cached = await getFromCache(name);
  if (!cached) {
    await downloadFromURL(RedistCache[name], cacheDir);
  }
  await runInstaller(cached, prefix);
}
```

### Mod Manager Integration

**Community Packages**
```typescript
interface GamePackage {
  id: string;
  name: string;
  description: string;
  mods: Mod[];
  dependencies: string[];
  compatibilityVersion: string;
}

interface Mod {
  id: string;
  name: string;
  version: string;
  url: string;
  conflicts: string[];
  loadOrder: number;
}
```

**Package Installer**
```bash
# Install modpack from community
ws-cli install-pack modding/skyrim-community-edition

# Apply mod pack to existing install
ws-cli apply-pack <app-id> community/my-mod-list --backup

# Manage mods
ws-cli mods <app-id> list          # List installed
ws-cli mods <app-id> add <mod-id>  # Install mod
ws-cli mods <app-id> remove <id>   # Uninstall
ws-cli mods <app-id> reorder       # Change load order
```

### Dependency Resolution

```typescript
// Automatic installer for missing DLLs/runtimes
async function resolveDependencies(prefix: string): Promise<void> {
  const missing = await scanForMissingDLLs(prefix);
  
  for (const dll of missing) {
    const source = await findDLLSource(dll); // Online DB
    if (source) {
      await downloadAndInstall(source, prefix);
    }
  }
}
```

---

## Summary Timeline

| Phase | Duration | Status | Focus |
|-------|----------|--------|-------|
| 1-5 | ✅ Complete | Done | Backend scaffold + persistence |
| 6-10 | ✅ Complete | Done | Frontend UI + Tauri + Theme |
| 11-12 | ✅ Complete | Done | GitHub setup + CI |
| 13 | ✅ Complete | Done | **CLI expansion** |
| **14** | ✅ Complete | Done | **Snapshot management** |
| **15** | ⏳ Next | TODO | Cloud sync & backup |
| **16** | ⏳ Next | TODO | Testing & CI/CD |
| **17** | ⏳ Next | TODO | Security hardening |
| **18** | ⏳ Next | TODO | Multi-runtime support |
| **19** | ⏳ Next | TODO | Advanced features |

**Total estimated remaining: 15-17 weeks** (with parallel efforts: 10-12 weeks)

---

## Success Criteria

✅ **By End of Phase 14:** Functional snapshot system with CLI access  
✅ **By End of Phase 16:** >80% test coverage, automated releases  
✅ **By End of Phase 17:** AppArmor sandbox, malware scanning  
✅ **By End of Phase 18:** Proton support, multi-runtime switching  
✅ **By End of Phase 19:** Full-featured app store with mods  

---

## Resource Requirements

- **Development:** 1-2 full-time developers
- **Testing:** Continuous integration on 2-3 Linux distributions
- **Tools:** Jest, GHA, Docker, Podman, ClamAV, AppArmor
- **Infrastructure:** S3/Azure storage for cloud sync (phase 15+)

---

## Community & Contribution

Welcome contributions in areas:
- Translation (UI localization)
- Game compatibility reports
- AppArmor profile testing
- Proton integration improvements
- Documentation & tutorials

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
