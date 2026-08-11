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