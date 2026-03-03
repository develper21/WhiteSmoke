export interface AppRecord {
  id: string;
  name: string;
  prefixPath: string;
  installerPath?: string;
  installed: boolean;
  launchCount: number;
  lastLaunch?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstallLog {
  id: string;
  appId: string;
  timestamp: string;
  message: string;
  status: 'info' | 'warning' | 'error';
}

export interface WinePrefix {
  id: string;
  path: string;
  createdAt: Date;
  appId: string;
}

export interface SandboxPolicy {
  id: string;
  appId: string;
  cpuShares: number;
  memoryLimit: string;
  diskQuota: string;
  networkAccess: boolean;
}
