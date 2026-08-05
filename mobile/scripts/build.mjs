import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const mobileDir = path.resolve(scriptsDir, '..');
const repositoryDir = path.resolve(mobileDir, '..');
const outputDir = path.join(mobileDir, 'dist');

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const entries = await readdir(mobileDir, { withFileTypes: true });

for (const entry of entries) {
  if ([
    'dist',
    'node_modules',
    '.vercel',
    'android',
    'ios',
    'package.json',
    'package-lock.json',
    'scripts',
    'README.md',
    'capacitor.config.ts'
  ].includes(entry.name)) {
    continue;
  }

  const sourcePath = path.join(mobileDir, entry.name);
  const outputPath = path.join(outputDir, entry.name);

  await cp(sourcePath, outputPath, { recursive: entry.isDirectory() });
}

// La version finale mobile reçoit toujours la même couche Supabase que le web.
await cp(
  path.join(repositoryDir, 'web', 'lib', 'supabase.js'),
  path.join(outputDir, 'lib', 'supabase.js')
);

console.log('Build mobile termine.');