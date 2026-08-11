import {
  readFile,
  readdir
} from 'node:fs/promises';

import path from 'node:path';

import {
  fileURLToPath
} from 'node:url';

const scriptDirectory =
  path.dirname(
    fileURLToPath(import.meta.url)
  );

const distDirectory =
  path.resolve(
    scriptDirectory,
    '..',
    'dist'
  );

const forbiddenPaths = [
  '.env',
  '.gitignore',
  'package.json',
  'package-lock.json',
  'playwright.config.mjs',
  'vercel.json',
  'scripts/',
  'tests/',
  'playwright-report/',
  'test-results/',
  'blob-report/'
];

const textExtensions = new Set([
  '.html',
  '.css',
  '.js',
  '.jsx',
  '.mjs',
  '.json',
  '.txt',
  '.map',
  '.md'
]);

const secretPatterns = [
  {
    label: 'clé privée',
    pattern:
      /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/
  },
  {
    label: 'clé Supabase service role',
    pattern:
      /SUPABASE_SERVICE_ROLE_KEY/i
  },
  {
    label: 'jeton Supabase service role',
    pattern:
      /c2VydmljZV9yb2xl/
  },
  {
    label: 'mot de passe de base de données',
    pattern:
      /SUPABASE_DB_PASSWORD/i
  },
  {
    label: 'secret de signature Android',
    pattern:
      /ANDROID_(?:STORE|KEY)_PASSWORD/i
  },
  {
    label: 'clé SMTP Brevo',
    pattern:
      /xsmtpsib-[A-Za-z0-9_-]{20,}/
  },
  {
    label: 'jeton GitHub',
    pattern:
      /(?:ghp_|github_pat_)[A-Za-z0-9_-]{20,}/
  },
  {
    label: 'clé API privée',
    pattern:
      /sk-(?:proj-|live_|test_)[A-Za-z0-9_-]{16,}/
  }
];

async function listFiles(directory) {
  const entries = await readdir(
    directory,
    {
      withFileTypes: true
    }
  );

  const files = [];

  for (const entry of entries) {
    const absolutePath =
      path.join(
        directory,
        entry.name
      );

    if (entry.isDirectory()) {
      files.push(
        ...await listFiles(
          absolutePath
        )
      );
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function normalizeRelativePath(
  absolutePath
) {
  return path
    .relative(
      distDirectory,
      absolutePath
    )
    .split(path.sep)
    .join('/');
}

const files =
  await listFiles(distDirectory);

const violations = [];

for (const absolutePath of files) {
  const relativePath =
    normalizeRelativePath(
      absolutePath
    );

  const forbiddenPath =
    forbiddenPaths.find(
      function findForbiddenPath(rule) {
        return (
          relativePath === rule ||
          relativePath.startsWith(rule)
        );
      }
    );

  if (forbiddenPath) {
    violations.push(
      relativePath +
      ' ne doit pas être publié.'
    );

    continue;
  }

  if (
    relativePath
      .toLowerCase()
      .endsWith('.jsx')
  ) {
    violations.push(
      relativePath +
      ' est un fichier JSX brut et ne doit pas être publié.'
    );

    continue;
  }

  const extension =
    path.extname(relativePath)
      .toLowerCase();

  if (!textExtensions.has(extension)) {
    continue;
  }

  const content =
    await readFile(
      absolutePath,
      'utf8'
    );

  for (
    const secretPattern
    of secretPatterns
  ) {
    if (
      secretPattern.pattern.test(
        content
      )
    ) {
      violations.push(
        relativePath +
        ' semble contenir : ' +
        secretPattern.label +
        '.'
      );
    }
  }
}

const publicIndexHtml =
  await readFile(
    path.join(
      distDirectory,
      'index.html'
    ),
    'utf8'
  );

  if (
  /src="[^"]+\.jsx"/i.test(
    publicIndexHtml
  )
) {
  violations.push(
    'index.html référence encore un fichier .jsx.'
  );
}


const forbiddenDevelopmentRuntimes = [
  'react.development.js',
  'react-dom.development.js',
  '@babel/standalone'
];

for (
  const developmentRuntime
  of forbiddenDevelopmentRuntimes
) {
  if (
    publicIndexHtml.includes(
      developmentRuntime
    )
  ) {
    violations.push(
      'index.html publie encore le runtime de développement : ' +
      developmentRuntime +
      '.'
    );
  }
}

if (violations.length) {
  throw new Error(
    [
      'Le build public contient des éléments interdits :',
      '',
      ...violations.map(
        violation =>
          '- ' + violation
      )
    ].join('\n')
  );
}

console.log(
  'Build public vérifié : ' +
  files.length +
  ' fichiers, aucun secret détecté.'
);