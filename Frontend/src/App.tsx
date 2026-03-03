import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GlassCard } from './components/GlassCard';
import { ThemeToggle } from './components/ThemeToggle';
// Tauri event listener for update notifications
try {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  (async () => {
    const ev = await import('@tauri-apps/api/event');
    ev.listen('update-available', (e: any) => {
      // simple alert for now; could show notification UI
      alert('Update available: ' + e.payload);
    });
    ev.listen('update-none', () => {
      alert('No updates available');
    });
    ev.listen('update-error', (e: any) => {
      alert('Update check failed: ' + e.payload);
    });
  })();
} catch (e) {
  // not running in Tauri
}

interface AppRecord {
  id: string;
  name: string;
  prefixPath: string;
  installerPath?: string;
  installed: boolean;
  launchCount: number;
  lastLaunch?: string;
  createdAt: string;
}

export default function App() {
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [appName, setAppName] = useState('');
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settingsApp, setSettingsApp] = useState<AppRecord | null>(null);
  const [cpuShares, setCpuShares] = useState(256);
  const [memoryMb, setMemoryMb] = useState(1024);
  const [pidsLimit, setPidsLimit] = useState(0);

  // Fetch apps from backend
  const fetchApps = async () => {
    try {
      const { data } = await axios.get('/api/apps');
      setApps(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch apps:', err);
    }
  };

  // Poll for updates every 2 seconds
  useEffect(() => {
    fetchApps();
    const interval = setInterval(fetchApps, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    if (!selectedFile || !appName) {
      alert('Please select a file and enter app name');
      return;
    }

    setInstalling(true);
    try {
      // upload file first
      const form = new FormData();
      form.append('installer', selectedFile);
      const uploadResp = await axios.post('/api/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('upload response', uploadResp.data);
      if (!uploadResp.data.isValid) {
        alert('Invalid installer: ' + (uploadResp.data.errorMessage || '')); 
        setInstalling(false);
        return;
      }
      const installerPath = uploadResp.data.path;

      const { data } = await axios.post('/api/install', {
        name: appName,
        installerPath,
      });

      console.log('Installation started:', data);
      setAppName('');
      setSelectedFile(null);
    } catch (err) {
      console.error('Failed to start install:', err);
      alert('Failed to start installation');
    } finally {
      setInstalling(false);
      setProgress(0);
    }
  };

  const launchApp = async (app: AppRecord) => {
    try {
      await axios.post('/api/launch', {
        id: app.id,
        exe: app.installerPath,
      });
    } catch (err) {
      console.error('Launch failed:', err);
      alert('Launch failed');
    }
  };

  const deleteApp = async (id: string) => {
    if (!confirm('Are you sure you want to delete this app?')) return;
    
    try {
      await axios.delete(`/api/apps/${id}`);
      setApps(apps.filter(a => a.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-8 text-white">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Whitesmoke</h1>
          <p className="text-gray-300">Run Windows apps on Linux with style</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Install Panel */}
      <GlassCard className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Install New App</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="App name"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-ice/50"
          />
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) setSelectedFile(file);
            }}
            className="w-full px-4 py-12 bg-white/10 border border-white/20 rounded-lg text-white text-center"
          >
            {selectedFile ? selectedFile.name : 'Drag & drop installer here, or click to select'}
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept=".exe,.msi"
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <button
            onClick={handleInstall}
            disabled={installing}
            className="w-full px-4 py-2 bg-ice/20 border border-ice/50 rounded-lg hover:bg-ice/40 disabled:opacity-50"
          >
            {installing ? 'Installing...' : 'Start Installation'}
          </button>
          {installing && <GlassProgressBar progress={progress} label="Download & install" />}
        </div>
      </GlassCard>

      {/* Apps Grid */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-4">
          Installed Apps ({apps.length})
        </h2>
      </div>

      {loading ? (
        <GlassCard className="p-8 text-center">
          <p>Loading apps...</p>
        </GlassCard>
      ) : apps.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-gray-400">No apps installed yet. Install one to get started!</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <GlassCard key={app.id} className="p-4 flex flex-col">
              <h3 className="font-bold text-lg mb-2">{app.name}</h3>
              <div className="text-sm text-gray-400 mb-4 flex-1">
                <p>Status: {app.installed ? '✅ Installed' : '⏳ Installing...'}</p>
                <p>Launches: {app.launchCount}</p>
                {app.lastLaunch && (
                  <p>Last: {new Date(app.lastLaunch).toLocaleDateString()}</p>
                )}
              </div>
              <div className="flex gap-2">
                {app.installed && (
                  <button
                    onClick={() => launchApp(app)}
                    className="flex-1 px-3 py-2 bg-ice/20 border border-ice/50 rounded hover:bg-ice/40 text-sm"
                  >
                    Launch
                  </button>
                )}
                <button
                  onClick={() => setSettingsApp(app)}
                  className="flex-1 px-3 py-2 bg-ice/10 border border-ice/30 rounded hover:bg-ice/20 text-sm"
                >
                  Settings
                </button>
                <button
                  onClick={() => deleteApp(app.id)}
                  className="flex-1 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded hover:bg-red-500/40 text-sm"
                >
                  Remove
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Settings Modal */}
      {settingsApp && (
        <GlassModal
          isOpen={true}
          title={`Settings: ${settingsApp.name}`}
          onClose={() => setSettingsApp(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300">CPU shares (relative)</label>
              <input
                type="number"
                value={cpuShares}
                onChange={(e) => setCpuShares(+e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Memory limit (MB)</label>
              <input
                type="number"
                value={memoryMb}
                onChange={(e) => setMemoryMb(+e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300">PIDs limit</label>
              <input
                type="number"
                value={pidsLimit}
                onChange={(e) => setPidsLimit(+e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
            <button
              onClick={async () => {
                try {
                  await axios.post(`/api/apps/${settingsApp.id}/limits`, {
                    cpuShares,
                    memoryMb,
                    pids: pidsLimit || undefined,
                  });
                  setSettingsApp(null);
                } catch (err) {
                  console.error('Failed to set limits', err);
                  alert('Could not update limits');
                }
              }}
              className="w-full px-4 py-2 bg-ice/20 border border-ice/50 rounded-lg hover:bg-ice/40"
            >
              Apply
            </button>
          </div>
        </GlassModal>
      )}
    </div>
  );
}
