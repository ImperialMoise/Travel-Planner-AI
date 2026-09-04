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

const vercelConfigPath =
  path.resolve(
    scriptDirectory,
    '..',
    'vercel.json'
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
  'blob-report/',
  'views/image-slot.js'
];

const textExtensions = new Set([
  '.html',
  '.css',
  '.js',
  '.jsx',
  '.mjs',
  '.json',
  '.svg',
  '.webmanifest',
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


const requiredObservabilityMarkers = [
  '/_vercel/insights/script.js',
  '/_vercel/speed-insights/script.js',
  'sensitiveUrlParameters',
  'beforeSend'
];

for (
  const observabilityMarker
  of requiredObservabilityMarkers
) {
  if (
    !publicIndexHtml.includes(
      observabilityMarker
    )
  ) {
    violations.push(
      'index.html ne contient pas le suivi Vercel : ' +
      observabilityMarker +
      '.'
    );
  }
}

const localPublishedScripts =
  [
    ...publicIndexHtml.matchAll(
   /<script[^>]+src="(?!https?:\/\/|\/\/|\/_vercel\/)([^"]+)"[^>]*><\/script>/g
    )
  ].map(
    function readPublishedScript(
      match
    ) {
      return match[1];
    }
  );

if (
  localPublishedScripts.length !== 1 ||
  localPublishedScripts[0] !==
    'app.bundle.js'
) {
  violations.push(
    'index.html doit charger uniquement app.bundle.js comme script local.'
  );
}

const requiredDeferredScriptTags = [
  '<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin defer></script>',
  '<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin defer></script>',
  '<script src="app.bundle.js" defer></script>'
];

for (
  const deferredScriptTag
  of requiredDeferredScriptTags
) {
  if (
    !publicIndexHtml.includes(
      deferredScriptTag
    )
  ) {
    violations.push(
      'Script non différé dans index.html : ' +
      deferredScriptTag +
      '.'
    );
  }
}

const publicBundleJavaScript =
  await readFile(
    path.join(
      distDirectory,
      'app.bundle.js'
    ),
    'utf8'
  );

const requiredBundleMarkers = [
  'initAppShell',
  'initTripPrint',
  'initAtelierV2'
];

for (
  const bundleMarker
  of requiredBundleMarkers
) {
  if (
    !publicBundleJavaScript.includes(
      bundleMarker
    )
  ) {
    violations.push(
      'app.bundle.js ne contient pas : ' +
      bundleMarker +
      '.'
    );
  }
}

const publicAppShellJavaScript =
  await readFile(
    path.join(
      distDirectory,
      'ui',
      'AppShell.js'
    ),
    'utf8'
  );

const requiredErrorLogMarkers = [
  'lfav_client_errors',
  'ClientErrorLog',
  'ClientPerformance',
  'largest-contentful-paint'
];

for (
  const errorLogMarker
  of requiredErrorLogMarkers
) {
  if (
    !publicAppShellJavaScript.includes(
      errorLogMarker
    )
  ) {
    violations.push(
      'AppShell.js ne contient pas le journal technique : ' +
      errorLogMarker +
      '.'
    );
  }
}

const publicStylesCss =
  await readFile(
    path.join(
      distDirectory,
      'styles.css'
    ),
    'utf8'
  );

const requiredAccessibilityStyleMarkers = [
  'prefers-reduced-motion',
  ':focus-visible',
  '.screen-reader-only'
];

for (
  const accessibilityMarker
  of requiredAccessibilityStyleMarkers
) {
  if (
    !publicStylesCss.includes(
      accessibilityMarker
    )
  ) {
    violations.push(
      'styles.css ne garantit plus l’accessibilité : ' +
      accessibilityMarker +
      '.'
    );
  }
}

const requiredAccessibilityShellMarkers = [
  'Aller au contenu principal',
  'screen-reader-only',
  'aria-live="polite"'
];

for (
  const accessibilityMarker
  of requiredAccessibilityShellMarkers
) {
  if (
    !publicAppShellJavaScript.includes(
      accessibilityMarker
    )
  ) {
    violations.push(
      'AppShell.js ne garantit plus l’accessibilité : ' +
      accessibilityMarker +
      '.'
    );
  }
}

const publicTripPrintJavaScript =
  await readFile(
    path.join(
      distDirectory,
      'ui',
      'TripPrint.js'
    ),
    'utf8'
  );

const requiredTripPrintMarkers = [
  'downloadPdf',
  'printDocument',
  'html2pdf.bundle.min.js',
  "format: 'a4'",
  'pdf-exporting'
];

for (
  const tripPrintMarker
  of requiredTripPrintMarkers
) {
  if (
    !publicTripPrintJavaScript.includes(
      tripPrintMarker
    )
  ) {
    violations.push(
      'TripPrint.js ne contient pas la fonction PDF : ' +
      tripPrintMarker +
      '.'
    );
  }
}

const publicServiceWorkerJavaScript =
  await readFile(
    path.join(
      distDirectory,
      'service-worker.js'
    ),
    'utf8'
  );

const requiredServiceWorkerMarkers = [
  'la-fabrique-static-v3',
  "'/'",
  "'/styles.css'",
  "'/app.bundle.js'",
  'ignoreSearch: true'
];

for (
  const serviceWorkerMarker
  of requiredServiceWorkerMarkers
) {
  if (
    !publicServiceWorkerJavaScript.includes(
      serviceWorkerMarker
    )
  ) {
    violations.push(
      'service-worker.js ne garantit plus le cache hors ligne : ' +
      serviceWorkerMarker +
      '.'
    );
  }
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

const vercelConfig =
  JSON.parse(
    await readFile(
      vercelConfigPath,
      'utf8'
    )
  );

const globalHeaderRule =
  (
    vercelConfig.headers || []
  ).find(
    rule =>
      rule.source === '/(.*)'
  );

const configuredHeaders =
  new Map(
    (
      globalHeaderRule?.headers || []
    ).map(
      header => [
        String(header.key)
          .toLowerCase(),
        String(header.value || '')
      ]
    )
  );

const requiredSecurityHeaders = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy'
];

for (
  const requiredHeader
  of requiredSecurityHeaders
) {
  if (
    !configuredHeaders.has(
      requiredHeader
    )
  ) {
    violations.push(
      'En-tête Vercel absent : ' +
      requiredHeader +
      '.'
    );
  }
}

const contentSecurityPolicy =
  configuredHeaders.get(
    'content-security-policy'
  ) || '';

const requiredPolicyDirectives = [
  "default-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "connect-src 'self'",
  "worker-src 'self' blob:"
];

for (
  const requiredDirective
  of requiredPolicyDirectives
) {
  if (
    !contentSecurityPolicy.includes(
      requiredDirective
    )
  ) {
    violations.push(
      'Directive CSP absente : ' +
      requiredDirective +
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