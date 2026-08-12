import {
  test,
  expect
} from '@playwright/test';

const TEST_EMAIL =
  process.env.E2E_TEST_EMAIL || '';

const TEST_PASSWORD =
  process.env.E2E_TEST_PASSWORD || '';

const TEST_TRIP_PREFIX =
  'E2E-CODEX-';

async function removeTestTrips(
  page,
  exactName
) {
  return page.evaluate(
    async function cleanup({
      prefix,
      tripName
    }) {
      if (
        !window.SB?.listMyTrips ||
        !window.SB?.deleteTrip
      ) {
        return {
          deleted: 0,
          nonTestTrips: 0
        };
      }

      const trips =
        await window.SB.listMyTrips();

      const testTrips =
        trips.filter(
          function selectTestTrip(trip) {
            const name =
              String(trip.name || '');

            return tripName
              ? name === tripName
              : name.startsWith(prefix);
          }
        );

      for (
        const trip
        of testTrips
      ) {
        await window.SB.deleteTrip(
          trip.id
        );
      }

      return {
        deleted: testTrips.length,

        nonTestTrips:
          trips.filter(
            function selectPersonalTrip(
              trip
            ) {
              return !String(
                trip.name || ''
              ).startsWith(prefix);
            }
          ).length
      };
    },
    {
      prefix: TEST_TRIP_PREFIX,
      tripName: exactName || ''
    }
  );
}

test(
  'un utilisateur peut gérer un voyage puis se déconnecter',
  async function authenticatedFlow(
    { page },
    testInfo
  ) {
    test.skip(
      testInfo.project.name !==
        'desktop-chromium',
      'Le parcours connecté complet est exécuté une seule fois.'
    );

    test.skip(
      !TEST_EMAIL ||
        !TEST_PASSWORD,
      'Les identifiants du compte E2E ne sont pas configurés.'
    );

    const javaScriptErrors = [];

    page.on(
      'pageerror',
      function collectError(error) {
        javaScriptErrors.push(
          error.message ||
            String(error)
        );
      }
    );

    const tripName =
      TEST_TRIP_PREFIX +
      Date.now();

    let signedIn = false;
    let tripCreated = false;

    try {
      await page.goto('/', {
        waitUntil:
          'domcontentloaded'
      });

      await page
        .getByRole('button', {
          name:
            'J’ai déjà un compte',
          exact: true
        })
        .click();

      const authDialog =
        page.getByRole('dialog');

      await expect(
        authDialog
      ).toBeVisible();

      await authDialog
        .getByLabel('Email')
        .fill(TEST_EMAIL);

      await authDialog
        .getByLabel(
          'Mot de passe',
          {
            exact: true
          }
        )
        .fill(TEST_PASSWORD);

      await authDialog
        .locator(
          'button[type="submit"]'
        )
        .click();

      await expect(
        authDialog
      ).toBeHidden();

      signedIn = true;

      const initialCleanup =
        await removeTestTrips(
          page,
          ''
        );

      expect(
        initialCleanup.nonTestTrips,
        [
          'Le compte E2E contient un',
          'voyage qui n’a pas été créé',
          'par les tests. Utilise un',
          'compte exclusivement réservé',
          'aux tests.'
        ].join(' ')
      ).toBe(0);

      await page.reload({
        waitUntil:
          'domcontentloaded'
      });

      await expect(
        page.getByLabel(
          'Destination'
        )
      ).toBeVisible();

      await page
        .getByLabel('Destination')
        .fill(tripName);

      await page
        .getByLabel(
          'Créer le voyage'
        )
        .click();

      tripCreated = true;

      await expect(
        page.getByText(
          tripName,
          {
            exact: true
          }
        ).first()
      ).toBeVisible();

      await page
        .getByRole('button', {
          name: 'Budget',
          exact: true
        })
        .click();

      await expect(
        page.locator(
          '.web-budget-page'
        )
      ).toBeVisible();

      await expect(
        page.getByText(
          'Aucune dépense pour l\'instant.'
        )
      ).toBeVisible();

      await page
        .getByRole('button', {
          name: 'Docs',
          exact: true
        })
        .click();

      await expect(
        page.locator(
          '.web-docs-page'
        )
      ).toBeVisible();

      await page
        .getByRole('button', {
          name: 'Paramètres',
          exact: true
        })
        .click();

      const settingsDialog =
        page.getByRole(
          'dialog',
          {
            name:
              'Paramètres du compte'
          }
        );

      await expect(
        settingsDialog
      ).toBeVisible();

      await expect(
        settingsDialog
          .getByRole(
            'heading',
            {
              name: 'Mon profil'
            }
          )
      ).toBeVisible();

      await settingsDialog
        .getByRole('button', {
          name: 'Mes voyages',
          exact: true
        })
        .click();

      const tripRow =
        settingsDialog
          .locator(
            '.settings-trip-row'
          )
          .filter({
            hasText: tripName
          });

      await expect(
        tripRow
      ).toBeVisible();

      page.once(
        'dialog',
        async function confirmDeletion(
          confirmation
        ) {
          await confirmation.accept();
        }
      );

      await tripRow
        .getByRole('button', {
          name: 'Supprimer',
          exact: true
        })
        .click();

      await expect(
        tripRow
      ).toBeHidden();

      tripCreated = false;

      await settingsDialog
        .getByRole('button', {
          name: 'Mon compte',
          exact: true
        })
        .click();

      await settingsDialog
        .getByRole('button', {
          name: 'Se déconnecter',
          exact: true
        })
        .click();

      signedIn = false;

      await expect(
        page.locator(
          '.home-page.is-public'
        )
      ).toBeVisible();

      expect(
        javaScriptErrors
      ).toEqual([]);
    } finally {
      if (
        signedIn &&
        tripCreated
      ) {
        try {
          await removeTestTrips(
            page,
            tripName
          );
        } catch (cleanupError) {
          console.warn(
            'Nettoyage E2E impossible :',
            cleanupError
          );
        }
      }

      if (signedIn) {
        try {
          await page.evaluate(
            async function signOut() {
              await window.SB
                ?.signOut?.();
            }
          );
        } catch (signOutError) {
          console.warn(
            'Déconnexion E2E impossible :',
            signOutError
          );
        }
      }
    }
  }
);