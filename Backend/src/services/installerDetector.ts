import fs from 'fs';
import path from 'path';

export interface InstallerInfo {
  filename: string;
  path: string;
  type: 'exe' | 'msi' | 'unknown';
  size: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Check if a file is a valid Windows installer
 */
export function detectInstallerType(filePath: string): InstallerInfo {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        filename: path.basename(filePath),
        path: filePath,
        type: 'unknown',
        size: 0,
        isValid: false,
        errorMessage: 'File not found',
      };
    }

    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);
    const ext = path.extname(filename).toLowerCase();

    // Read first few bytes to check magic numbers
    const buffer = Buffer.alloc(4);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);

    const magic = buffer.toString('hex').substring(0, 8);

    let type: 'exe' | 'msi' | 'unknown' = 'unknown';
    let isValid = false;

    if (ext === '.exe') {
      // PE executable magic: 4D 5A (MZ)
      if (magic.startsWith('4d5a')) {
        type = 'exe';
        isValid = true;
      }
    } else if (ext === '.msi') {
      // MSI files are OLE compound documents: D0 CF 11 E0
      if (magic.startsWith('d0cf11e0')) {
        type = 'msi';
        isValid = true;
      }
    }

    return {
      filename,
      path: filePath,
      type,
      size: stats.size,
      isValid,
      errorMessage: !isValid ? `Invalid ${ext} file format` : undefined,
    };
  } catch (err) {
    return {
      filename: path.basename(filePath),
      path: filePath,
      type: 'unknown',
      size: 0,
      isValid: false,
      errorMessage: err.toString(),
    };
  }
}

/**
 * Check if file is executable Windows installer
 */
export function isWindowsInstaller(filePath: string): boolean {
  const info = detectInstallerType(filePath);
  return info.isValid && (info.type === 'exe' || info.type === 'msi');
}

/**
 * Get recommended install flags based on installer type
 */
export function getInstallFlags(installerType: 'exe' | 'msi'): string {
  if (installerType === 'msi') {
    return '/i /quiet /qn /norestart';
  }
  return '/quiet /passive /norestart';
}
