#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_BASE = process.env.WHITESMOKE_API || 'http://localhost:4000';

yargs(hideBin(process.argv))
  .command(
    'install <name> <installer>',
    'install a Windows app',
    (y) => y.positional('name', { type: 'string' }).positional('installer', { type: 'string' }),
    async (argv) => {
      try {
        const installerPath = path.resolve(argv.installer as string);
        if (!fs.existsSync(installerPath)) {
          console.error('❌ Installer not found:', installerPath);
          process.exit(1);
        }
        const { data } = await axios.post(`${API_BASE}/api/install`, {
          name: argv.name,
          installerPath,
        });
        console.log('✅ Installation started:', data.id);
        console.log('ℹ️  Check status with: ws-cli list');
      } catch (err: any) {
        console.error('❌ Failed to install:', err.response?.data?.error || err.message);
        process.exit(1);
      }
    }
  )
  .command(
    'list',
    'list all installed apps',
    {},
    async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/apps`);
        if (data.length === 0) {
          console.log('📦 No apps installed');
          return;
        }
        console.log('\n📦 Installed Apps:\n');
        data.forEach((app: any) => {
          const status = app.installed ? '✅' : '⏳';
          const date = new Date(app.createdAt).toLocaleDateString();
          console.log(`${status} ${app.name}`);
          console.log(`   ID: ${app.id}`);
          console.log(`   Status: ${app.installed ? 'Installed' : 'Installing'}`);
          console.log(`   Launches: ${app.launchCount}`);
          console.log(`   Created: ${date}\n`);
        });
      } catch (err: any) {
        console.error('❌ Failed to list apps:', err.message);
        process.exit(1);
      }
    }
  )
  .command(
    'launch <id> <exe>',
    'launch an installed app',
    (y) => y.positional('id', { type: 'string' }).positional('exe', { type: 'string' }),
    async (argv) => {
      try {
        const { data } = await axios.post(`${API_BASE}/api/launch`, {
          id: argv.id,
          exe: argv.exe,
        });
        console.log('✅ App launched:', data.message);
      } catch (err: any) {
        console.error('❌ Failed to launch:', err.response?.data?.error || err.message);
        process.exit(1);
      }
    }
  )
  .command(
    'remove <id>',
    'remove an installed app',
    (y) => y.positional('id', { type: 'string' }),
    async (argv) => {
      try {
        const { data } = await axios.delete(`${API_BASE}/api/apps/${argv.id}`);
        console.log('✅ App removed:', data.app.name);
      } catch (err: any) {
        console.error('❌ Failed to remove:', err.response?.data?.error || err.message);
        process.exit(1);
      }
    }
  )
  .command(
    'snapshot <id>',
    'create a snapshot of an app',
    (y) => y.positional('id', { type: 'string' }).option('note', { type: 'string', describe: 'optional snapshot note' }),
    async (argv) => {
      try {
        const { data } = await axios.post(`${API_BASE}/api/apps/${argv.id}/snapshots`, {
          notes: argv.note,
        });
        console.log('✅ Snapshot created:', data.snapshot.id);
        console.log('   Size:', (data.snapshot.prefixSize / 1024 / 1024).toFixed(0), 'MB');
        console.log('   Path:', data.snapshot.timestamp);
      } catch (err: any) {
        console.error('❌ Failed to snapshot:', err.response?.data?.error || err.message);
        process.exit(1);
      }
    }
  )
  .command(
    'snapshots <id>',
    'list snapshots for an app',
    (y) => y.positional('id', { type: 'string' }),
    async (argv) => {
      try {
        const { data: snapshots } = await axios.get(`${API_BASE}/api/apps/${argv.id}/snapshots`);
        if (snapshots.length === 0) {
          console.log('📸 No snapshots found');
          return;
        }
        console.log('\n📸 Snapshots:\n');
        snapshots.forEach((snap: any) => {
          const date = new Date(snap.timestamp).toLocaleString();
          const size = (snap.prefixSize / 1024 / 1024).toFixed(0);
          console.log(`📦 ${snap.id}`);
          console.log(`   Date: ${date}`);
          console.log(`   Size: ${size} MB`);
          if (snap.notes) console.log(`   Notes: ${snap.notes}`);
          console.log();
        });
      } catch (err: any) {
        console.error('❌ Failed to list snapshots:', err.message);
        process.exit(1);
      }
    }
  )
  .command(
    'restore <id> <snapshotId>',
    'restore an app from a snapshot',
    (y) => y.positional('id', { type: 'string' }).positional('snapshotId', { type: 'string' }),
    async (argv) => {
      try {
        console.log(`🔄 Restoring snapshot...`);
        const { data } = await axios.post(`${API_BASE}/api/apps/${argv.id}/snapshots/${argv.snapshotId}/restore`);
        console.log('✅ Snapshot restored:', data.message);
      } catch (err: any) {
        console.error('❌ Failed to restore:', err.response?.data?.error || err.message);
        process.exit(1);
      }
    }
  )
  .option('api', {
    alias: 'a',
    describe: 'Backend API URL',
    default: API_BASE,
  })
  .help()
  .alias('h', 'help')
  .version()
  .alias('v', 'version')
  .strict().argv;
