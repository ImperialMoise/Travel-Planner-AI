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