import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformFileAsync } from '@babel/core';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(scriptDir, '..');
const outputDir = path.join(sourceDir, 'dist');
const indexPath = path.join(sourceDir, 'index.html');

const sourceHtml = await readFile(indexPath, 'utf8');
const excludedDirectories = new Set([
  'dist',
  'node_modules',
  '.vercel',
  'scripts',
  'tests',
  'playwright-report',
  'test-results',
  'blob-report'
]);

const excludedFiles = new Set([
  '.gitignore',
  'package.json',
  'package-lock.json',
  'playwright.config.mjs',
  'vercel.json',
  'README.md',
  'npm-debug.log',
  'image-slot.js'
]);

const babelScriptPattern = /<script\s+type="text\/babel"\s+src="([^"]+)"><\/script>/g;
const babelSources = [...sourceHtml.matchAll(babelScriptPattern)].map((match) => match[1]);

if (!babelSources.length) {
  throw new Error('Aucun script Babel trouve dans index.html.');
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

async function copyDirectory(source, destination) {
  await mkdir(destination, { recursive: true });

  const entries = await readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    if (
      entry.isFile() &&
      path.extname(entry.name)
        .toLowerCase() === '.jsx'
    ) {
      continue;
    }

    if (
      entry.isDirectory() &&
      excludedDirectories.has(entry.name)
    ) {
      continue;
    }

    if (
      entry.isFile() &&
      (
        excludedFiles.has(entry.name) ||
        entry.name.startsWith('.env')
      )
    ) {
      continue;
    }

    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await copyFile(sourcePath, destinationPath);
    }
  }
}

await copyDirectory(sourceDir, outputDir);

for (const relativePath of babelSources) {
  const sourceFile =
    path.join(
      sourceDir,
      relativePath
    );

  const outputRelativePath =
    relativePath.endsWith('.jsx')
      ? relativePath.slice(0, -4) + '.js'
      : relativePath;

  const outputFile =
    path.join(
      outputDir,
      outputRelativePath
    );

  const result = await transformFileAsync(sourceFile, {
    presets: [
      [
        '@babel/preset-react',
        {
          runtime: 'classic'
        }
      ]
    ],
    comments: false,
    compact: true,
    minified: true,
    sourceMaps: false
  });

  await writeFile(outputFile, `${result.code}\n`, 'utf8');
}

const outputHtml = sourceHtml
  .replace(
    /\s*<script\s+src="https:\/\/unpkg\.com\/@babel\/standalone[^>]*><\/script>/,
    ''
  )
  .replace(
    /type="text\/babel"\s+/g,
    ''
  )
  .replace(
    /src="([^"]+)\.jsx"/g,
    'src="$1.js"'
  );

const localClassicScriptPattern =
  /<script(?![^>]*\btype="module")[^>]*\bsrc="(?!https?:\/\/|\/\/|\/_vercel\/)([^"]+)"[^>]*><\/script>/g;

const bundleSources =
  [...outputHtml.matchAll(
    localClassicScriptPattern
  )].map(
    function readBundleSource(match) {
      return match[1];
    }
  );

if (!bundleSources.length) {
  throw new Error(
    'Aucun script local trouvé pour créer le bundle.'
  );
}

const bundleJavaScript =
  (
    await Promise.all(
      bundleSources.map(
        function loadBundleSource(
          relativePath
        ) {
          return readFile(
            path.join(
              outputDir,
              relativePath.replace(
                /^\.\//,
                ''
              )
            ),
            'utf8'
          );
        }
      )
    )
  ).join('\n;\n');

await writeFile(
  path.join(
    outputDir,
    'app.bundle.js'
  ),
  bundleJavaScript + '\n',
  'utf8'
);

const bundledHtml =
  outputHtml
    .replace(
      /(<script\s+src="https:\/\/unpkg\.com\/react(?:-dom)?@[^"]+"[^>]*)(><\/script>)/g,
      '$1 defer$2'
    )
    .replace(
      localClassicScriptPattern,
      ''
    )
    .replace(
      '</body>',
      [
        '  <script src="app.bundle.js" defer></script>',
        '',
        '</body>'
      ].join('\n')
    );

await writeFile(
  path.join(
    outputDir,
    'index.html'
  ),
  bundledHtml,
  'utf8'
);

console.log(
  'Build termine : ' +
  babelSources.length +
  ' scripts JSX compiles, ' +
  bundleSources.length +
  ' scripts regroupes.'
);