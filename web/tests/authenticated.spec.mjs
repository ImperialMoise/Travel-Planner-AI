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

const FIRST_DAY_NOTE =
  'E2E — Tour Eiffel';

const SECOND_DAY_NOTE =
  'E2E — Versailles';

const FIRST_STEP_LABEL =
  'E2E — Visite Tour Eiffel';

const SECOND_STEP_LABEL =
  'E2E — Déjeuner';

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

      await page.evaluate(
        async function prepareReorderTest({
          expectedTripName,
          firstDayNote,
          secondDayNote,
          firstStepLabel,
          secondStepLabel
        }) {
          const trips =
            await window.SB.listMyTrips();

          const targetTrip =
            trips.find(
              trip =>
                trip.name ===
                expectedTripName
            );

          if (!targetTrip) {
            throw new Error(
              'Voyage E2E introuvable.'
            );
          }

          const loadedTrip =
            await window.SB.loadTrip(
              targetTrip.id
            );

          const firstDay =
            loadedTrip?.days?.[0];

          const secondDay =
            loadedTrip?.days?.[1];

          if (!firstDay || !secondDay) {
            throw new Error(
              'Le voyage E2E doit contenir au moins deux journées.'
            );
          }

          await window.SB.updateDay(
            firstDay.id,
            {
              note: firstDayNote
            }
          );

          await window.SB.updateDay(
            secondDay.id,
            {
              note: secondDayNote
            }
          );

          await window.SB.saveStep(
            targetTrip.id,
            firstDay.id,
            {
              type: 'activite',
              label: firstStepLabel,
              time: '09:00',
              stepIndex: 0
            }
          );

          await window.SB.saveStep(
            targetTrip.id,
            firstDay.id,
            {
              type: 'activite',
              label: secondStepLabel,
              time: '12:00',
              stepIndex: 1
            }
          );
        },
        {
          expectedTripName: tripName,
          firstDayNote:
            FIRST_DAY_NOTE,
          secondDayNote:
            SECOND_DAY_NOTE,
          firstStepLabel:
            FIRST_STEP_LABEL,
          secondStepLabel:
            SECOND_STEP_LABEL
        }
      );

      await page.reload({
        waitUntil:
          'domcontentloaded'
      });

      await expect(
        page.getByText(
          tripName,
          {
            exact: true
          }
        ).first()
      ).toBeVisible();

      await page.setViewportSize({
        width: 390,
        height: 844
      });

      const firstDayCard =
        page.locator(
          '.day-card'
        ).filter({
          hasText:
            FIRST_DAY_NOTE
        });

      const secondDayCard =
        page.locator(
          '.day-card'
        ).filter({
          hasText:
            SECOND_DAY_NOTE
        });

      await expect(
        firstDayCard
      ).toBeVisible();

      await expect(
        secondDayCard
      ).toBeVisible();

      await firstDayCard
        .getByRole('button', {
          name:
            /vers le jour suivant/
        })
        .click();

      await expect(
        page.getByText(
          'Journée déplacée vers J2.',
          {
            exact: true
          }
        )
      ).toBeVisible();

      await expect
        .poll(
          async function readMode() {
            return page.evaluate(
              function getMode() {
                return localStorage
                  .getItem(
                    'atelier_app_mode'
                  );
              }
            );
          }
        )
        .toBe('plan');

      await expect(
        page.locator(
          '.travel-mode'
        )
      ).toHaveCount(0);

      await page.reload({
        waitUntil:
          'domcontentloaded'
      });

      const persistedDayNotes =
        await page
          .locator(
            '.day-card-note'
          )
          .allTextContents();

      expect(
        persistedDayNotes
          .slice(0, 2)
          .map(
            note => note.trim()
          )
      ).toEqual([
        SECOND_DAY_NOTE,
        FIRST_DAY_NOTE
      ]);

      const movedDayCard =
        page.locator(
          '.day-card'
        ).filter({
          hasText:
            FIRST_DAY_NOTE
        });

      await movedDayCard
        .locator(
          '.day-card-select'
        )
        .click();

      const timelineSteps =
        page.locator(
          '.atelier-v2-drop'
        );

      await expect(
        timelineSteps
      ).toHaveCount(2);

      await expect(
        timelineSteps.nth(0)
      ).toContainText(
        FIRST_STEP_LABEL
      );

      await expect(
        timelineSteps.nth(1)
      ).toContainText(
        SECOND_STEP_LABEL
      );

      await timelineSteps
        .nth(0)
        .getByRole('button', {
          name:
            'Déplacer l’étape vers le bas',
          exact: true
        })
        .click();

      await expect(
        page.getByText(
          'Nouvel ordre enregistré.',
          {
            exact: true
          }
        )
      ).toBeVisible();

      await page.reload({
        waitUntil:
          'domcontentloaded'
      });

      await page
        .locator(
          '.day-card'
        )
        .filter({
          hasText:
            FIRST_DAY_NOTE
        })
        .locator(
          '.day-card-select'
        )
        .click();

      const persistedSteps =
        page.locator(
          '.atelier-v2-drop'
        );

      await expect(
        persistedSteps
      ).toHaveCount(2);

      await expect(
        persistedSteps.nth(0)
      ).toContainText(
        SECOND_STEP_LABEL
      );

      await expect(
        persistedSteps.nth(1)
      ).toContainText(
        FIRST_STEP_LABEL
      );

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