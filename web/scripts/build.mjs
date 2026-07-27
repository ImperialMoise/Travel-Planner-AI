import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformFileAsync } from '@babel/core';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(scriptDir, '..');
const outputDir = path.join(sourceDir, 'dist');
const indexPath = path.join(sourceDir, 'index.html');

const sourceHtml = await readFile(indexPath, 'utf8');
const babelScriptPattern = /<script\s+type="text\/babel"\s+src="([^"]+)"><\/script>/g;
const babelSources = [...sourceHtml.matchAll(babelScriptPattern)].map((match) => match[1]);

if (!babelSources.length) {
  throw new Error('Aucun script Babel trouve dans index.html.');
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await cp(sourceDir, outputDir, {
  recursive: true,
  filter(source) {
    const name = path.basename(source);
    return !['dist', 'node_modules', '.vercel'].includes(name);
  }
});

for (const relativePath of babelSources) {
  const sourceFile = path.join(sourceDir, relativePath);
  const outputFile = path.join(outputDir, relativePath);

  const result = await transformFileAsync(sourceFile, {
    presets: [['@babel/preset-react', { runtime: 'classic' }]],
    sourceMaps: false
  });

  await writeFile(outputFile, `${result.code}\n`, 'utf8');
}

const outputHtml = sourceHtml
  .replace(/\s*<script\s+src="https:\/\/unpkg\.com\/@babel\/standalone[^>]*><\/script>/, '')
  .replace(/type="text\/babel"\s+/g, '');

await writeFile(path.join(outputDir, 'index.html'), outputHtml, 'utf8');

console.log(`Build termine : ${babelSources.length} scripts JSX compiles.`);