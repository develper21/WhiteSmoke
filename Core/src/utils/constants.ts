export const DEFAULT_PREFIX_PATH = '/var/lib/whitesmoke/prefixes';
export const TEMP_PREFIX_PATH = '/tmp/whitesmoke/prefixes';

export const APP_CONSTANTS = {
  MIN_MEMORY_MB: 256,
  MAX_MEMORY_MB: 16384,
  DEFAULT_MEMORY_MB: 1024,
  
  MIN_CPU_SHARES: 2,
  MAX_CPU_SHARES: 1024,
  DEFAULT_CPU_SHARES: 256,
  
  INSTALL_TIMEOUT_MS: 600000, // 10 minutes
  LAUNCH_TIMEOUT_MS: 120000,  // 2 minutes
};

export const WINE_SETTINGS = {
  QUIET_FLAG: '/quiet',
  PASSIVE_FLAG: '/passive',
  NORESTART_FLAG: '/norestart',
};
