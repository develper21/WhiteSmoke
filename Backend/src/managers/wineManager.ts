import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export function createPrefix(appId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const prefix = path.join('/tmp/whitesmoke/prefixes', appId);
    
    // Ensure parent directory exists
    const parentDir = path.dirname(prefix);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    exec(`mkdir -p "${prefix}" && WINEPREFIX="${prefix}" wineboot -i`, (err, stdout, stderr) => {
      if (err) {
        console.error('Wine prefix creation failed:', stderr);
        return reject(new Error(`Failed to create Wine prefix: ${stderr}`));
      }
      console.log(`Created Wine prefix at ${prefix}`);
      resolve(prefix);
    });
  });
}

export function installExe(prefix: string, exePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Verify exe exists
    if (!fs.existsSync(exePath)) {
      return reject(new Error(`Installer file not found: ${exePath}`));
    }

    const cmd = `WINEPREFIX="${prefix}" wine "${exePath}" /quiet /passive 2>&1`;
    exec(cmd, { timeout: 600000 }, (err, stdout, stderr) => {
      if (err) {
        console.error('Wine install error:', stderr || err.message);
        return reject(new Error(`Installation failed: ${stderr || err.message}`));
      }
      console.log(`Installation completed for ${exePath}`);
      resolve();
    });
  });
}

export function runExe(prefix: string, exeRelative: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = `WINEPREFIX="${prefix}" wine "${exeRelative}" 2>&1`;
    const child = exec(cmd, (err) => {
      if (err && err.code !== 0) {
        console.error('Wine execution error:', err.message);
        // Don't reject - wine apps may close with non-zero exit codes
      }
      resolve();
    });

    // Don't wait for completion - wine apps may run indefinitely
    setTimeout(() => resolve(), 1000);
  });
}
