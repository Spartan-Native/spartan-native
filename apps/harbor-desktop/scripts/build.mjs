// Builds Harbor Backup as a desktop app, on Windows, macOS and Linux:
//   1. ng build harbor-backup
//   2. copy dist/harbor-backup/browser → apps/harbor-desktop/frontend/dist (embedded by main.go)
//   3. go build → apps/harbor-desktop/bin/harbor-backup[.exe]
// Pass --run to start it afterwards.
import { execFileSync, spawn } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(app, '../..');
const exe = join(app, 'bin', process.platform === 'win32' ? 'harbor-backup.exe' : 'harbor-backup');
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });

console.log('› Building the Harbor web app');
run('npx', ['ng', 'build', 'harbor-backup'], root);

console.log('› Embedding it');
const dist = join(app, 'frontend', 'dist');
rmSync(dist, { recursive: true, force: true });
cpSync(join(root, 'dist', 'harbor-backup', 'browser'), dist, { recursive: true });

console.log('› Building the desktop binary');
mkdirSync(join(app, 'bin'), { recursive: true });
run('go', ['build', '-o', exe, '.'], app);
console.log(`✔ ${exe}`);

if (process.argv.includes('--run')) spawn(exe, { stdio: 'inherit' }).on('exit', (code) => process.exit(code ?? 0));
