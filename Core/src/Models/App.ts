export interface AppRecord {
  id: string;
  name: string;
  prefixPath: string;
  installerPath?: string;
  installed: boolean;
  launchCount: number;
  lastLaunch?: string | Date;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface CreateAppInput {
  name: string;
  installerPath: string;
}

export interface LaunchAppInput {
  id: string;
  exe: string;
}