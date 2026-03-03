import { exec } from 'child_process';
import path from 'path';

export interface ResourceLimits {
  cpuShares?: number;    // relative weight
  memoryMb?: number;     // limit in megabytes
  pids?: number;         // process count limit
}

const CGROUP_BASE = '/sys/fs/cgroup/whitesmoke';

function ensureCgroupApp(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.join(CGROUP_BASE, id);
    exec(`mkdir -p "${dir}"`, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function applyLimits(appId: string, limits: ResourceLimits): Promise<void> {
  await ensureCgroupApp(appId);
  const base = path.join(CGROUP_BASE, appId);
  const cmds: string[] = [];

  if (limits.cpuShares !== undefined) {
    cmds.push(`echo ${limits.cpuShares} > ${path.join(base, 'cpu.weight')}`);
  }
  if (limits.memoryMb !== undefined) {
    cmds.push(`echo $(( ${limits.memoryMb} * 1024 * 1024 )) > ${path.join(base, 'memory.max')}`);
  }
  if (limits.pids !== undefined) {
    cmds.push(`echo ${limits.pids} > ${path.join(base, 'pids.max')}`);
  }

  for (const c of cmds) {
    // shell expand
    await new Promise<void>((res, rej) => {
      exec(c, (err) => (err ? rej(err) : res()));
    });
  }
}

export async function addPid(appId: string, pid: number): Promise<void> {
  const file = path.join(CGROUP_BASE, appId, 'cgroup.procs');
  return new Promise((resolve, reject) => {
    exec(`echo ${pid} > ${file}`, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function removeCgroup(appId: string): Promise<void> {
  const dir = path.join(CGROUP_BASE, appId);
  return new Promise((resolve, reject) => {
    exec(`rmdir "${dir}"`, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
