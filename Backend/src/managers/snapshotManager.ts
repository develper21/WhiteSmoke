/**
 * Snapshot Manager
 * Handles creation and restoration of Wine prefix snapshots with metadata
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

export interface SnapshotMetadata {
  id: string;
  appId: string;
  appName: string;
  timestamp: string;
  prefixPath: string;
  prefixSize: number; // bytes
  wineVersion: string | null;
  notes?: string;
}

export class SnapshotManager {
  private snapshotsDir: string;

  constructor(snapshotsDir: string = path.join(process.env.HOME || '/tmp', '.whitesmoke/snapshots')) {
    this.snapshotsDir = snapshotsDir;
    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
    }
  }

  /**
   * Create a snapshot of a Wine prefix
   */
  async createSnapshot(
    appId: string,
    appName: string,
    prefixPath: string,
    notes?: string
  ): Promise<SnapshotMetadata> {
    if (!fs.existsSync(prefixPath)) {
      throw new Error(`Prefix path not found: ${prefixPath}`);
    }

    const snapshotId = uuidv4();
    const timestamp = new Date().toISOString();
    const prefixSize = this.getDirectorySize(prefixPath);
    const wineVersion = this.detectWineVersion(prefixPath);

    const metadata: SnapshotMetadata = {
      id: snapshotId,
      appId,
      appName,
      timestamp,
      prefixPath,
      prefixSize,
      wineVersion,
      notes,
    };

    // Save as tar.gz
    const fileName = `${snapshotId}-${appName.replace(/\s+/g, '_')}.tar.gz`;
    const snapshotPath = path.join(this.snapshotsDir, fileName);

    console.log(`[Snapshot] Creating: ${fileName}`);
    console.log(`[Snapshot]   Size: ${(prefixSize / 1024 / 1024 / 1024).toFixed(2)} GB`);

    try {
      const parentDir = path.dirname(prefixPath);
      const prefixName = path.basename(prefixPath);
      const cmd = `tar --exclude='*.log' -czf "${snapshotPath}" -C "${parentDir}" "${prefixName}"`;
      execSync(cmd, { stdio: 'pipe' });
    } catch (err) {
      fs.unlinkSync(snapshotPath);
      throw new Error(`Failed to create tar archive: ${err.toString()}`);
    }

    // Save metadata
    const metadataPath = snapshotPath + '.json';
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`[Snapshot] Complete! Metadata saved to ${metadataPath}`);
    return metadata;
  }

  /**
   * Restore a snapshot to its original location (or new location)
   */
  async restoreSnapshot(snapshotPath: string, targetPrefixPath: string): Promise<void> {
    if (!fs.existsSync(snapshotPath)) {
      throw new Error(`Snapshot not found: ${snapshotPath}`);
    }

    const metadataPath = snapshotPath + '.json';
    let metadata: SnapshotMetadata | null = null;

    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      console.log(`[Restore] Snapshot: ${metadata.appName} (${metadata.timestamp})`);
    }

    // Remove existing prefix if present
    if (fs.existsSync(targetPrefixPath)) {
      console.log(`[Restore] Removing old prefix: ${targetPrefixPath}`);
      execSync(`rm -rf "${targetPrefixPath}"`);
    }

    // Create parent directory
    const parentDir = path.dirname(targetPrefixPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Extract tar.gz
    console.log(`[Restore] Extracting snapshot...`);
    try {
      const cmd = `tar -xzf "${snapshotPath}" -C "${parentDir}"`;
      execSync(cmd, { stdio: 'pipe' });
    } catch (err) {
      throw new Error(`Failed to extract snapshot: ${err.toString()}`);
    }

    console.log(`[Restore] Complete! Prefix restored to ${targetPrefixPath}`);
  }

  /**
   * List all available snapshots
   */
  listSnapshots(): SnapshotMetadata[] {
    const files = fs.readdirSync(this.snapshotsDir);
    const snapshots: SnapshotMetadata[] = [];

    files.forEach((file) => {
      if (file.endsWith('.tar.gz.json')) {
        const metadataPath = path.join(this.snapshotsDir, file);
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          snapshots.push(metadata);
        } catch (err) {
          console.warn(`[Snapshot] Failed to parse metadata: ${file}`);
        }
      }
    });

    return snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get snapshots for a specific app
   */
  getAppSnapshots(appId: string): SnapshotMetadata[] {
    return this.listSnapshots().filter((snap) => snap.appId === appId);
  }

  /**
   * Delete a snapshot
   */
  deleteSnapshot(snapshotId: string): void {
    const files = fs.readdirSync(this.snapshotsDir);
    let found = false;

    files.forEach((file) => {
      if (file.startsWith(snapshotId) && file.endsWith('.tar.gz')) {
        const snapshotPath = path.join(this.snapshotsDir, file);
        const metadataPath = snapshotPath + '.json';

        fs.unlinkSync(snapshotPath);
        if (fs.existsSync(metadataPath)) {
          fs.unlinkSync(metadataPath);
        }
        found = true;
      }
    });

    if (!found) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }
  }

  /**
   * Get the full path of a snapshot by ID
   */
  getSnapshotPath(snapshotId: string): string | null {
    const files = fs.readdirSync(this.snapshotsDir);
    const found = files.find((f) => f.startsWith(snapshotId) && f.endsWith('.tar.gz'));
    return found ? path.join(this.snapshotsDir, found) : null;
  }

  // Private helpers

  private getDirectorySize(dirPath: string): number {
    try {
      const output = execSync(`du -sb "${dirPath}"`, { encoding: 'utf-8' });
      return parseInt(output.split(/\s+/)[0], 10);
    } catch {
      return 0;
    }
  }

  private detectWineVersion(prefixPath: string): string | null {
    try {
      const versionFile = path.join(prefixPath, 'system.reg');
      if (fs.existsSync(versionFile)) {
        const content = fs.readFileSync(versionFile, 'utf-8');
        const match = content.match(/"CurrentVersion"="([^"]+)"/);
        return match ? match[1] : null;
      }
    } catch {
      // ignore
    }
    return null;
  }
}

export default SnapshotManager;
