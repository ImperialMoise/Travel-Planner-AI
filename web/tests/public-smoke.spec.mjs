import {
  test,
  expect
} from '@playwright/test';

function monitorJavaScriptErrors(page) {
  const errors = [];

  page.on('pageerror', function collectError(
    error
  ) {
    errors.push(
      error.message || String(error)
    );
  });

  return errors;
}

test.beforeEach(async function resetBrowser({
  context,
  page
}) {
  await context.clearCookies();

  await page.addInitScript(function clearStorage() {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test(
  'la page publique se charge sans erreur JavaScript',
  async function runTest({ page }) {
    const javaScriptErrors =
      monitorJavaScriptErrors(page);

    await page.goto('/', {
      waitUntil: 'domcontentloaded'
    });

    await expect(
      page.locator('#root')
    ).not.toBeEmpty();

    await expect(
      page.locator('.home-page.is-public')
    ).toBeVisible();

    await expect(
      page.getByRole('heading', {
        name: 'La Fabrique à Voyages',
        level: 1
      })
    ).toBeVisible();

    await expect(
      page.getByLabel('Créer le voyage')
    ).toBeVisible();

    expect(javaScriptErrors).toEqual([]);
  }
);

test(
  'le formulaire public refuse une destination vide',
  async function runTest({ page }) {
    const javaScriptErrors =
      monitorJavaScriptErrors(page);

    await page.goto('/', {
      waitUntil: 'domcontentloaded'
    });

    await page
      .getByLabel('Créer le voyage')
      .click();

    await expect(
      page.locator('.home-hero-error')
    ).toContainText(
      'Indique une destination'
    );

    expect(javaScriptErrors).toEqual([]);
  }
);

test(
  'la fenêtre de connexion propose tous les parcours',
  async function runTest({ page }) {
    const javaScriptErrors =
      monitorJavaScriptErrors(page);

    await page.goto('/', {
      waitUntil: 'domcontentloaded'
    });

    await page
      .getByRole('button', {
        name: 'J’ai déjà un compte',
        exact: true
      })
      .click();

    const dialog =
      page.getByRole('dialog');

    await expect(dialog).toBeVisible();

    await expect(
      dialog.locator('#app-modal-title')
    ).toHaveText('Connexion');

    await expect(
      dialog.getByLabel('Email')
    ).toBeVisible();

    await expect(
      dialog.getByLabel(
        'Mot de passe',
        {
          exact: true
        }
      )
    ).toBeVisible();

    await dialog
      .locator('.mode-tab')
      .filter({
        hasText: 'Créer un compte'
      })
      .click();

    await expect(
      dialog.locator('#app-modal-title')
    ).toHaveText(
      'Créer un compte'
    );

    await expect(
      dialog.getByLabel('Pseudo')
    ).toBeVisible();

    await expect(
      dialog.getByLabel(
        'Confirmer le mot de passe'
      )
    ).toBeVisible();

    await dialog
      .locator('.mode-tab')
      .filter({
        hasText: 'Se connecter'
      })
      .click();

    await dialog
      .getByRole('button', {
        name: 'Mot de passe oublié ?',
        exact: true
      })
      .click();

    await expect(
      dialog.locator('#app-modal-title')
    ).toHaveText(
      'Nouveau mot de passe'
    );

    await expect(
      dialog.getByText(
        '← Retour à la connexion'
      )
    ).toBeVisible();

    expect(javaScriptErrors).toEqual([]);
  }
);

test(
  'la fenêtre conserve le focus et se ferme avec Échap',
  async function runTest({ page }) {
    await page.goto('/', {
      waitUntil: 'domcontentloaded'
    });

    const openButton =
      page.getByRole('button', {
        name: 'J’ai déjà un compte',
        exact: true
      });

    await openButton.click();

    const dialog =
      page.getByRole('dialog');

    await expect(dialog).toBeVisible();

    const focusIsInside =
      await dialog.evaluate(
        function checkFocus(element) {
          return element.contains(
            document.activeElement
          );
        }
      );

    expect(focusIsInside).toBe(true);

    for (
      let index = 0;
      index < 12;
      index += 1
    ) {
      await page.keyboard.press('Tab');

      const stillInside =
        await dialog.evaluate(
          function checkFocus(element) {
            return element.contains(
              document.activeElement
            );
          }
        );

      expect(stillInside).toBe(true);
    }

    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();

    await expect(openButton).toBeFocused();
  }
);

test(
  'le responsive mobile ne déborde pas horizontalement',
  async function runTest(
    {
      page
    },
    testInfo
  ) {
    test.skip(
      testInfo.project.name !==
        'mobile-chromium',
      'Test réservé au format mobile'
    );

    const javaScriptErrors =
      monitorJavaScriptErrors(page);

    await page.goto('/', {
      waitUntil: 'domcontentloaded'
    });

    const dimensions =
      await page.evaluate(function readDimensions() {
        return {
          viewportWidth:
            window.innerWidth,

          documentWidth:
            document.documentElement
              .scrollWidth
        };
      });

    expect(
      dimensions.documentWidth
    ).toBeLessThanOrEqual(
      dimensions.viewportWidth + 1
    );

    expect(javaScriptErrors).toEqual([]);
  }
);

test(
  'les photos mobiles autorisent le défilement vertical',
  async function runTest(
    {
      page
    },
    testInfo
  ) {
    test.skip(
      testInfo.project.name !==
        'mobile-chromium',
      'Test réservé au format mobile'
    );

    await page.goto('/', {
      waitUntil: 'domcontentloaded'
    });

    const inspiration =
      page.locator(
        '.home-inspiration-item'
      ).first();

    await inspiration
      .scrollIntoViewIfNeeded();

    await expect(
      inspiration
    ).toBeVisible();

    const touchAction =
      await inspiration.evaluate(
        function readTouchAction(element) {
          return window
            .getComputedStyle(element)
            .touchAction;
        }
      );

    const allowsVerticalPan =
      touchAction === 'auto' ||
      touchAction === 'manipulation' ||
      touchAction
        .split(' ')
        .includes('pan-y');

    expect(allowsVerticalPan).toBe(true);

    const image =
      inspiration.locator('img');

    await expect(image).toHaveAttribute(
      'draggable',
      'false'
    );
  }
);

test(
  'le build public ne contient aucun fichier de développement',
  async function runTest({ request }) {
    const privatePaths = [
      '/package.json',
      '/package-lock.json',
      '/playwright.config.mjs',
      '/scripts/build.mjs',
      '/tests/public-smoke.spec.mjs',
      '/views/image-slot.js',
      '/.env'
    ];

    for (
      const privatePath
      of privatePaths
    ) {
      const response =
        await request.get(
          privatePath
        );

      expect(
        response.status(),
        privatePath +
          ' ne doit pas être public'
      ).toBe(404);
    }
  }
);

test(
  'la page publique expose ses métadonnées de partage',
  async function runTest({ page }) {
    await page.goto('/', {
      waitUntil: 'domcontentloaded'
    });

    await expect(page).toHaveTitle(
      'La Fabrique à Voyages — Planifie et suis ton voyage'
    );

    await expect(
      page.locator(
        'link[rel="canonical"]'
      )
    ).toHaveAttribute(
      'href',
      'https://travel-planner-ai-chi.vercel.app/'
    );

    await expect(
      page.locator(
        'meta[property="og:title"]'
      )
    ).toHaveAttribute(
      'content',
      'La Fabrique à Voyages — Planifie et suis ton voyage'
    );

    await expect(
      page.locator(
        'meta[property="og:description"]'
      )
    ).toHaveAttribute(
      'content',
      /Construis ton itinéraire/
    );

    await expect(
      page.locator(
        'meta[name="twitter:card"]'
      )
    ).toHaveAttribute(
      'content',
      'summary'
    );
  }
);

test(
  'la carte reste déchargée sur l’accueil public',
  async function runTest({ page }) {
    const mapLibreRequests = [];

    page.on(
      'request',
      function monitorRequest(request) {
        if (
          request.url()
            .includes('maplibre-gl')
        ) {
          mapLibreRequests.push(
            request.url()
          );
        }
      }
    );

    await page.goto('/', {
      waitUntil: 'domcontentloaded'
    });

    await expect(
      page.locator('.home-page.is-public')
    ).toBeVisible();

    await page.waitForTimeout(500);

    expect(mapLibreRequests).toEqual([]);
  }
);

test(
  'le clavier permet d’aller directement au contenu',
  async function runTest(
    { page },
    testInfo
  ) {
    test.skip(
      testInfo.project.name ===
        'mobile-chromium',
      'La navigation clavier est vérifiée sur ordinateur.'
    );
    await page.goto('/', {
      waitUntil: 'domcontentloaded'
    });

    const skipLink =
      page.getByRole('link', {
        name: 'Aller au contenu principal'
      });

    await skipLink.waitFor({
      state: 'attached'
    });

    await expect(
      page.locator(
        '.home-page.is-public'
      )
    ).toBeVisible();

    await page.keyboard.press('Tab');

    await expect(
      skipLink
    ).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press('Enter');

    await expect(
      page.locator('#app-main-content')
    ).toBeFocused();
  }
);

test(
  'les images secondaires utilisent le chargement différé',
  async function runTest({ page }) {
    await page.goto('/', {
      waitUntil: 'domcontentloaded'
    });

    await expect(
      page.locator(
        '.home-page.is-public'
      )
    ).toBeVisible();

    const lazyImages =
      page.locator(
        [
          '.home-inspiration-item img',
          '.home-public-qr img'
        ].join(',')
      );

    const imageCount =
      await lazyImages.count();

    expect(imageCount).toBeGreaterThan(0);

    const invalidImages =
      await lazyImages.evaluateAll(
        function inspectImages(
          images
        ) {
          return images
            .map(
              function inspectImage(
                image,
                index
              ) {
                return {
                  index,
                  loading:
                    image.getAttribute(
                      'loading'
                    ),
                  decoding:
                    image.getAttribute(
                      'decoding'
                    ),
                  draggable:
                    image.getAttribute(
                      'draggable'
                    )
                };
              }
            )
            .filter(
              function findInvalid(
                image
              ) {
                return (
                  image.loading !==
                    'lazy' ||
                  image.decoding !==
                    'async' ||
                  image.draggable !==
                    'false'
                );
              }
            );
        }
      );

    expect(
      invalidImages
    ).toEqual([]);

    const viewportWidth =
      await page.evaluate(
        function readViewportWidth() {
          return window.innerWidth;
        }
      );

    const expectedHeroWidth =
      viewportWidth <= 760
        ? 'w=960'
        : 'w=1600';

    const heroBackground =
      await page
        .locator('.home-hero-bg')
        .evaluate(
          function readHeroBackground(
            element
          ) {
            return element.style
              .backgroundImage;
          }
        );

    expect(heroBackground).toContain(
      expectedHeroWidth
    );

    expect(heroBackground).toContain(
      'q=78'
    );

    const inspirationSources =
      await page
        .locator(
          '.home-inspiration-item img'
        )
        .evaluateAll(
          function readImageSources(
            images
          ) {
            return images.map(
              function readImageSource(
                image
              ) {
                return image.src;
              }
            );
          }
        );

    expect(
      inspirationSources.every(
        function imageIsOptimized(
          source
        ) {
          return (
            source.includes('w=720') &&
            source.includes('q=78')
          );
        }
      )
    ).toBe(true);
  }
);

test(
  'les scripts applicatifs sont regroupés dans le bundle public',
  async function runTest({ request }) {
    const indexResponse =
      await request.get('/');

    expect(
      indexResponse.status()
    ).toBe(200);

    const html =
      await indexResponse.text();

    expect(html).toContain(
      'src="app.bundle.js"'
    );

    expect(html).not.toContain(
      '.jsx'
    );

    expect(html).not.toContain(
      'src="ui/AppShell.js"'
    );

    expect(html).toContain(
      '<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin defer></script>'
    );

    expect(html).toContain(
      '<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin defer></script>'
    );

    expect(html).toContain(
      '<script src="app.bundle.js" defer></script>'
    );

    const bundleResponse =
      await request.get(
        '/app.bundle.js'
      );

    expect(
      bundleResponse.status()
    ).toBe(200);

    expect(
      bundleResponse.headers()[
        'content-type'
      ] || ''
    ).toMatch(
      /javascript/i
    );

    const bundleSource =
      await bundleResponse.text();

    expect(bundleSource).toContain(
      'initAppShell'
    );

    expect(bundleSource).toContain(
      'initTripPrint'
    );

    expect(bundleSource).toContain(
      'initAtelierV2'
    );

    const rawJsx =
      await request.get(
        '/views/itin-atelier-v2.jsx'
      );

    expect(
      rawJsx.status()
    ).toBe(404);
  }
);

test(
  'la version web est installable et distincte de l’APK',
  async function runTest({
    page,
    request
  }) {
    await page.goto('/', {
      waitUntil: 'domcontentloaded'
    });

    await expect(
      page.locator(
        'link[rel="manifest"]'
      )
    ).toHaveAttribute(
      'href',
      '/manifest.webmanifest'
    );

    const manifestResponse =
      await request.get(
        '/manifest.webmanifest'
      );

    expect(
      manifestResponse.status()
    ).toBe(200);

    const manifest =
      await manifestResponse.json();

    expect(manifest).toMatchObject({
      id: '/',
      start_url: '/',
      display: 'standalone',
      prefer_related_applications:
        false
    });

    expect(
      manifest.icons
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sizes: '192x192'
        }),
        expect.objectContaining({
          sizes: '512x512'
        })
      ])
    );

    for (
      const icon
      of manifest.icons
    ) {
      const iconResponse =
        await request.get(icon.src);

      expect(
        iconResponse.status(),
        icon.src
      ).toBe(200);
    }

    const workerResponse =
      await request.get(
        '/service-worker.js'
      );

    expect(
      workerResponse.status()
    ).toBe(200);

    expect(
      workerResponse.headers()[
        'content-type'
      ] || ''
    ).toMatch(/javascript/i);

    const workerSource =
      await workerResponse.text();

    expect(
      workerSource
    ).toContain(
      "'la-fabrique-static-v2'"
    );

    expect(
      workerSource
    ).toContain(
      'await fetch(request)'
    );

    const offlineResponse =
      await request.get(
        '/offline.html'
      );

    expect(
      offlineResponse.status()
    ).toBe(200);

    await expect
      .poll(
        async function workerRegistered() {
          return page.evaluate(
            async function checkWorker() {
              const registration =
                await navigator
                  .serviceWorker
                  .getRegistration('/');

              return Boolean(
                registration
              );
            }
          );
        },
        {
          timeout: 10_000
        }
      )
      .toBe(true);

    await expect(
      page.locator(
        '.web-mobile-banner'
      )
    ).toContainText(
      'Version web complète'
    );

    await expect(
      page.locator(
        '.web-mobile-banner'
      )
    ).toContainText(
      'APK Android'
    );
  }
);

test(
  'le créateur guidé comprend plusieurs séjours successifs',
  async ({ page }) => {
    await page.goto('/', {
      waitUntil: 'load'
    });

    const plan =
      await page.evaluate(
        function parseNaturalTrip() {
          return window.TripDraftParser.parse(
            'Je pars en Corée du Sud du 1 au 12 octobre 2026, cinq nuits à Séoul, trois nuits à Gyeongju, puis trois nuits à Busan.'
          );
        }
      );

    expect(plan.errors).toEqual([]);
    expect(plan.name).toBe(
      'Corée du Sud'
    );
    expect(plan.startDate).toBe(
      '2026-10-01'
    );
    expect(plan.endDate).toBe(
      '2026-10-12'
    );

    const stays =
      plan.items
        .filter((item) =>
          item.type === 'logement'
        )
        .map((item) => ({
          label: item.lieu,
          start: item.dateStart,
          end: item.dateEnd
        }));

    expect(stays).toEqual([
      {
        label: 'Séoul',
        start: '2026-10-01',
        end: '2026-10-06'
      },
      {
        label: 'Gyeongju',
        start: '2026-10-06',
        end: '2026-10-09'
      },
      {
        label: 'Busan',
        start: '2026-10-09',
        end: '2026-10-12'
      }
    ]);
  }
);

test(
  'le créateur guidé comprend les éléments écrits naturellement',
  async function runTest({ page }) {
    await page.goto('/', {
      waitUntil: 'load'
    });

    const plan =
      await page.evaluate(
        function parseNaturalItems() {
          return window.TripDraftParser.parse(
            [
              'Je pars en Corée du Sud du 1 au 12 octobre 2026, cinq nuits à Séoul, trois nuits à Gyeongju, puis trois nuits à Busan.',
              'Le 6 octobre 2026, train de Séoul à Gyeongju à 08:30.',
              'Le 7 octobre 2026, visite du temple Bulguksa à Gyeongju à 10:00.',
              'Le 10 octobre 2026, dîner chez Jagalchi à Busan à 19:30.'
            ].join('\n')
          );
        }
      );

    expect(plan.errors).toEqual([]);

    expect(
      plan.items
        .find(
          (item) =>
            item.type === 'transport'
        )
    ).toMatchObject({
      date: '2026-10-06',
      depart: 'Séoul',
      arrivee: 'Gyeongju',
      transportType: 'train',
      time: '08:30'
    });

    expect(
      plan.items
        .find(
          (item) =>
            item.type === 'activite'
        )
    ).toMatchObject({
      date: '2026-10-07',
      label: 'temple Bulguksa',
      lieu: 'Gyeongju',
      time: '10:00'
    });

    expect(
      plan.items
        .find(
          (item) =>
            item.type === 'restaurant'
        )
    ).toMatchObject({
      date: '2026-10-10',
      label: 'Jagalchi',
      lieu: 'Busan',
      time: '19:30'
    });
  }
);


test(
  'le diagnostic contient les mesures de performance',
  async function performanceDiagnostic({
    page
  }) {
    await page.goto('/', {
      waitUntil: 'load'
    });

    const metrics =
      await page.evaluate(
        function readPerformanceMetrics() {
          return window
            .ClientPerformance
            ?.snapshot?.() || null;
        }
      );

    expect(
      metrics
    ).not.toBeNull();

    expect(
      metrics
    ).toEqual(
      expect.objectContaining({
        ttfbMs:
          expect.any(Number),
        domContentLoadedMs:
          expect.any(Number),
        loadMs:
          expect.any(Number),
        cls:
          expect.any(Number),
        connection:
          expect.any(String),
        dataSaver:
          expect.any(Boolean),
        viewport:
          expect.any(String)
      })
    );

    expect(
      metrics.ttfbMs
    ).toBeGreaterThanOrEqual(0);

    expect(
      metrics.domContentLoadedMs
    ).toBeGreaterThanOrEqual(
      metrics.ttfbMs
    );

    expect(
      metrics.loadMs
    ).toBeGreaterThanOrEqual(
      metrics.domContentLoadedMs
    );

    expect(
      metrics.cls
    ).toBeGreaterThanOrEqual(0);
  }
);