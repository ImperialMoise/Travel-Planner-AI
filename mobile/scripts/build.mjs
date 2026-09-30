import { cp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as buildJavaScript } from 'esbuild';

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
    'capacitor.config.ts',
    'app.js'
  ].includes(entry.name)) {
    continue;
  }

  const sourcePath = path.join(mobileDir, entry.name);
  const outputPath = path.join(outputDir, entry.name);

  await cp(sourcePath, outputPath, { recursive: entry.isDirectory() });
}

await buildJavaScript({
  entryPoints: [path.join(mobileDir, 'app.js')],
  outfile: path.join(outputDir, 'app.js'),
  bundle: true,
  external: ['./offline-vendor/*'],
  format: 'iife',
  platform: 'browser',
  target: ['chrome120'],
  minify: false,
  sourcemap: false,
  logLevel: 'info'
});

// La version finale mobile reçoit toujours la même couche Supabase que le web.
await cp(
  path.join(repositoryDir, 'web', 'lib', 'supabase.js'),
  path.join(outputDir, 'lib', 'supabase.js')
);

// PDF.js est livré dans l’APK : aucune dépendance Internet pour lire les billets.
const pdfResponse = await fetch('https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-5.4.149.tgz', {
  signal: AbortSignal.timeout(120000)
});
if (!pdfResponse.ok) throw new Error('Téléchargement du lecteur PDF impossible.');
const pdfArchive = Buffer.from(await pdfResponse.arrayBuffer());
const { createHash } = await import('node:crypto');
if (createHash('sha512').update(pdfArchive).digest('base64') !== 'Xe8/1FMJEQPUVSti25AlDpwpUm2QAVmNOpFP0SIahaPIOKBKICaefbzogLdwey3XGGoaP4Lb9wqiw2e9Jqp0LA==') {
  throw new Error('Intégrité du lecteur PDF incorrecte.');
}
const { gunzipSync } = await import('node:zlib');
const { writeFile } = await import('node:fs/promises');
const tar = gunzipSync(pdfArchive);
const pdfFiles = new Set();
for (let offset = 0; offset + 512 <= tar.length;) {
  const header = tar.subarray(offset, offset + 512);
  const name = header.subarray(0, 100).toString().replace(/\0.*$/, '');
  if (!name) break;
  const length = parseInt(header.subarray(124, 136).toString().replace(/\0.*$/, '').trim(), 8) || 0;
  if (!Number.isSafeInteger(length) || length < 0 || offset + 512 + length > tar.length) throw new Error('Archive PDF invalide.');
  const relative = name.replace(/^package\//, '');
  const allowed = /^(build\/pdf(?:\.worker)?\.mjs|LICENSE|(?:cmaps|standard_fonts|wasm)\/[a-zA-Z0-9_.-]+)$/.test(relative);
  if (allowed && (header[156] === 48 || header[156] === 0)) {
    const target = path.join(outputDir, 'offline-vendor', relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, tar.subarray(offset + 512, offset + 512 + length));
    pdfFiles.add(relative);
  }
  offset += 512 + Math.ceil(length / 512) * 512;
}
for (const file of ['build/pdf.mjs', 'build/pdf.worker.mjs', 'LICENSE']) {
  if (!pdfFiles.has(file)) throw new Error('Lecteur PDF incomplet : ' + file);
}

async function listOutputFiles(directory, rootDirectory = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listOutputFiles(entryPath, rootDirectory));
      continue;
    }

    files.push(
      path.relative(rootDirectory, entryPath).replaceAll('\\', '/')
    );
  }

  return files;
}

const outputFiles = await listOutputFiles(outputDir);
const failures = [];

const requiredFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'offline.html',
  'offline-pack.js',
  'offline-vendor/build/pdf.mjs',
  'offline-vendor/build/pdf.worker.mjs',
  'lib/supabase.js'
];

for (const requiredFile of requiredFiles) {
  if (!outputFiles.includes(requiredFile)) {
    failures.push(`Fichier obligatoire absent : ${requiredFile}`);
  }
}

const forbiddenFileNames = new Set([
  '.env',
  'package.json',
  'package-lock.json',
  'readme.md',
  'capacitor.config.ts'
]);

const forbiddenDirectories = new Set([
  '.vercel',
  'android',
  'ios',
  'node_modules',
  'scripts'
]);

const sensitiveExtensions = [
  '.jks',
  '.keystore',
  '.p12',
  '.pfx',
  '.pem',
  '.key'
];

for (const file of outputFiles) {
  const normalizedFile = file.toLowerCase();
  const parts = normalizedFile.split('/');
  const fileName = parts.at(-1);

  const containsForbiddenDirectory = parts.some((part) =>
    forbiddenDirectories.has(part)
  );

  const hasSensitiveExtension = sensitiveExtensions.some((extension) =>
    fileName.endsWith(extension)
  );

  if (
    forbiddenFileNames.has(fileName) ||
    containsForbiddenDirectory ||
    hasSensitiveExtension
  ) {
    failures.push(`Fichier interdit dans dist : ${file}`);
  }

  if (fileName.endsWith('.map')) {
    failures.push(`Source map inutile dans la version publique : ${file}`);
  }
}

const appBundlePath = path.join(outputDir, 'app.js');
const supabaseBundlePath = path.join(outputDir, 'lib', 'supabase.js');

const appBundle = await readFile(appBundlePath, 'utf8');
const supabaseBundle = await readFile(supabaseBundlePath, 'utf8');

const requiredAppFeatures = [
  ['notifications natives', 'localNotificationActionPerformed'],
  ['sauvegarde et restauration', 'window.TripBackup'],
  ['couvertures de journée', 'mobile-day-cover-backdrop'],
  ['réorganisation des étapes', 'move-step-up'],
  ['thèmes de voyage', 'MOBILE_TRIP_ACCENTS'],
  ['bilan statistique du voyage', 'renderMobileSummary'],
  ['gestion des rôles', 'toggle-trip-member-role'],
  ['transfert de propriété', 'transfer-trip-ownership'],
  ['départ d’un voyage partagé', 'leave-shared-trip'],
  ['partage natif d’itinéraire', 'shareMobileTrip'],
  ['plugin de partage Android', 'Share.share']
];
for (const [featureName, marker] of requiredAppFeatures) {
  if (!appBundle.includes(marker)) {
    failures.push(`Fonction mobile absente du build : ${featureName}`);
  }
}

const requiredSupabaseFeatures = [
  ['réorganisation des journées', 'export async function moveTripDayInsideFixedRange'],
  ['rappels de voyage', 'export async function listMyReminders'],
  ['gestion des rôles', 'export async function updateTripMemberRole'],
  ['transfert de propriété', 'export async function transferTripOwnership'],
  ['départ d’un voyage partagé', 'export async function leaveTrip']
];

for (const [featureName, marker] of requiredSupabaseFeatures) {
  if (!supabaseBundle.includes(marker)) {
    failures.push(`Fonction Supabase absente du build : ${featureName}`);
  }
}

const appBundleStats = await stat(appBundlePath);
const maximumBundleSize = 2 * 1024 * 1024;

if (appBundleStats.size > maximumBundleSize) {
  failures.push(
    `app.js dépasse 2 Mio : ${(appBundleStats.size / 1024 / 1024).toFixed(2)} Mio`
  );
}

if (failures.length > 0) {
  throw new Error(
    `Verification du build mobile echouee :\n- ${failures.join('\n- ')}`
  );
}

console.log(
  `Build mobile termine et verifie : ${outputFiles.length} fichiers, ` +
  `${(appBundleStats.size / 1024).toFixed(1)} Kio pour app.js.`
);