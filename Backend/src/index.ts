import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { createPrefix, installExe, runExe } from './managers/wineManager';
import { detectInstallerType } from './services/installerDetector';
import { applyLimits, addPid } from './managers/sandboxManager';
import SnapshotManager from './managers/snapshotManager';

const app = express();
const prisma = new PrismaClient();
const snapshotMgr = new SnapshotManager();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!require('fs').existsSync(uploadDir)) {
  require('fs').mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

app.use(bodyParser.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Upload installer file
app.post('/api/upload', upload.single('installer'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'file required' });
  }
  const info = detectInstallerType(req.file.path);
  res.json(info);
});

// Install new Windows app
app.post('/api/install', async (req, res) => {
  const { name, installerPath } = req.body as { name: string; installerPath: string };
  if (!installerPath) {
    return res.status(400).json({ error: 'installerPath required' });
  }

  try {
    const id = uuidv4();
    const prefixPath = await createPrefix(id);

    // Save to database
    const appRecord = await prisma.app.create({
      data: {
        id,
        name,
        prefixPath,
        installerPath,
        installed: false,
      },
    });

    // Run installer asynchronously
    installExe(prefixPath, installerPath)
      .then(async () => {
        await prisma.app.update({
          where: { id },
          data: { installed: true },
        });
        console.log(`[${name}] installation completed`);
      })
      .catch(async (err) => {
        console.error(`[${name}] installation failed:`, err);
        await prisma.app.update({
          where: { id },
          data: { installed: false },
        });
      });

    // apply default sandbox limits right away
    applyLimits(id, { cpuShares: 256, memoryMb: 1024 }).catch(console.warn);

    res.json({ id, message: 'installation started' });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Get all installed apps
app.get('/api/apps', async (req, res) => {
  try {
    const apps = await prisma.app.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Get single app
app.get('/api/apps/:id', async (req, res) => {
  try {
    const app = await prisma.app.findUnique({
      where: { id: req.params.id },
    });
    if (!app) {
      return res.status(404).json({ error: 'app not found' });
    }
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Launch app
app.post('/api/launch', async (req, res) => {
  const { id, exe } = req.body as { id: string; exe: string };
  
  try {
    const appRecord = await prisma.app.findUnique({
      where: { id },
    });

    if (!appRecord) {
      return res.status(404).json({ error: 'app not found' });
    }

    if (!appRecord.installed) {
      return res.status(400).json({ error: 'app not yet installed' });
    }

    // Update last launch time and increment counter
    await prisma.app.update({
      where: { id },
      data: {
        lastLaunch: new Date(),
        launchCount: { increment: 1 },
      },
    });

    // Launch the executable asynchronously
    runExe(appRecord.prefixPath, exe)
      .then(() => {
        // after we start wine process, try to put it into cgroup
        // naive: take last spawned pid from prefix? For now skip.
      })
      .catch((err) => {
        console.error(`[${appRecord.name}] launch error:`, err);
      });

    res.json({ ok: true, message: 'app launched' });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Set resource limits for an app
app.post('/api/apps/:id/limits', async (req, res) => {
  const { cpuShares, memoryMb, pids } = req.body as {
    cpuShares?: number;
    memoryMb?: number;
    pids?: number;
  };
  try {
    const appRecord = await prisma.app.findUnique({
      where: { id: req.params.id },
    });
    if (!appRecord) {
      return res.status(404).json({ error: 'app not found' });
    }
    await applyLimits(appRecord.id, { cpuShares, memoryMb, pids });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Get install logs
app.get('/api/logs/:appId', async (req, res) => {
  try {
    const logs = await prisma.installLog.findMany({
      where: { appId: req.params.appId },
      orderBy: { timestamp: 'asc' },
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Delete app
app.delete('/api/apps/:id', async (req, res) => {
  try {
    // Delete associated logs
    await prisma.installLog.deleteMany({
      where: { appId: req.params.id },
    });

    // Delete app
    const deleted = await prisma.app.delete({
      where: { id: req.params.id },
    });

    res.json({ ok: true, message: 'app deleted', app: deleted });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Create snapshot
app.post('/api/apps/:id/snapshots', async (req, res) => {
  const { notes } = req.body as { notes?: string };
  
  try {
    const appRecord = await prisma.app.findUnique({
      where: { id: req.params.id },
    });

    if (!appRecord) {
      return res.status(404).json({ error: 'app not found' });
    }

    console.log(`[API] Creating snapshot for ${appRecord.name}...`);
    const metadata = await snapshotMgr.createSnapshot(
      appRecord.id,
      appRecord.name,
      appRecord.prefixPath,
      notes
    );

    // Store snapshot in database
    const snapshotPath = snapshotMgr.getSnapshotPath(metadata.id);
    if (snapshotPath) {
      await prisma.snapshot.create({
        data: {
          id: metadata.id,
          appId: appRecord.id,
          snapshotPath,
          prefixSize: metadata.prefixSize,
          wineVersion: metadata.wineVersion,
          notes,
        },
      });
    }

    res.json({ ok: true, snapshot: metadata });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// List snapshots for an app
app.get('/api/apps/:id/snapshots', async (req, res) => {
  try {
    const appRecord = await prisma.app.findUnique({
      where: { id: req.params.id },
    });

    if (!appRecord) {
      return res.status(404).json({ error: 'app not found' });
    }

    const snapshots = await prisma.snapshot.findMany({
      where: { appId: req.params.id },
      orderBy: { timestamp: 'desc' },
    });

    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Restore snapshot
app.post('/api/apps/:id/snapshots/:snapshotId/restore', async (req, res) => {
  try {
    const appRecord = await prisma.app.findUnique({
      where: { id: req.params.id },
    });

    if (!appRecord) {
      return res.status(404).json({ error: 'app not found' });
    }

    const snapshot = await prisma.snapshot.findUnique({
      where: { id: req.params.snapshotId },
    });

    if (!snapshot) {
      return res.status(404).json({ error: 'snapshot not found' });
    }

    console.log(`[API] Restoring snapshot ${snapshot.id} for ${appRecord.name}...`);
    await snapshotMgr.restoreSnapshot(snapshot.snapshotPath, appRecord.prefixPath);

    res.json({ ok: true, message: 'snapshot restored' });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Delete snapshot
app.delete('/api/snapshots/:snapshotId', async (req, res) => {
  try {
    const snapshot = await prisma.snapshot.findUnique({
      where: { id: req.params.snapshotId },
    });

    if (!snapshot) {
      return res.status(404).json({ error: 'snapshot not found' });
    }

    snapshotMgr.deleteSnapshot(req.params.snapshotId);
    await prisma.snapshot.delete({
      where: { id: req.params.snapshotId },
    });

    res.json({ ok: true, message: 'snapshot deleted' });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log(`whitesmoke-backend listening on port ${port}`);
  console.log(`database: ${process.env.DATABASE_URL}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('shutting down...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('server closed');
    process.exit(0);
  });
});
