import {
  test,
  expect
} from '@playwright/test';

const TEST_EMAIL =
  process.env.E2E_TEST_EMAIL || '';

const TEST_PASSWORD =
  process.env.E2E_TEST_PASSWORD || '';

const COLLABORATOR_EMAIL =
  process.env.E2E_COLLABORATOR_EMAIL || '';

const COLLABORATOR_PASSWORD =
  process.env.E2E_COLLABORATOR_PASSWORD || '';

test.describe.configure({
  mode: 'serial'
});

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

const REMINDER_TITLE =
  'E2E — Réserver les billets';

async function signInTestAccount(
  page,
  email,
  password
) {
  await page.goto('/', {
    waitUntil:
      'domcontentloaded'
  });

  await page.waitForFunction(
    function waitForSupabase() {
      return Boolean(
        window.SB?.signIn
      );
    }
  );

  await page.evaluate(
    async function signIn({
      accountEmail,
      accountPassword
    }) {
      await window.SB.signIn(
        accountEmail,
        accountPassword
      );
    },
    {
      accountEmail: email,
      accountPassword: password
    }
  );

  await page.reload({
    waitUntil:
      'domcontentloaded'
  });

  await page.waitForFunction(
    function waitForTrips() {
      return Boolean(
        window.SB?.listMyTrips
      );
    }
  );
}

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

    const duplicateTripName =
      tripName + '-COPIE';

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

      const accessibilityIssues =
        await page.evaluate(
          function findUnnamedControls() {
            function hasAccessibleName(
              control
            ) {
              const ariaLabel =
                control
                  .getAttribute(
                    'aria-label'
                  )
                  ?.trim();

              if (ariaLabel) {
                return true;
              }

              const labelledBy =
                control.getAttribute(
                  'aria-labelledby'
                );

              if (labelledBy) {
                const labelText =
                  labelledBy
                    .split(/\s+/)
                    .map(id =>
                      document
                        .getElementById(id)
                        ?.textContent
                        ?.trim() || ''
                    )
                    .join(' ')
                    .trim();

                if (labelText) {
                  return true;
                }
              }

              if (
                control.id &&
                document.querySelector(
                  `label[for="${CSS.escape(control.id)}"]`
                )
              ) {
                return true;
              }

              return Boolean(
                control.closest('label')
              );
            }

            const formControls =
              Array.from(
                document.querySelectorAll(
                  'input, select, textarea'
                )
              )
                .filter(
                  control =>
                    !hasAccessibleName(
                      control
                    )
                )
                .map(
                  control =>
                    control.placeholder ||
                    control.id ||
                    control.tagName
                );

            const editableRegions =
              Array.from(
                document.querySelectorAll(
                  '[contenteditable="true"]'
                )
              )
                .filter(
                  control =>
                    !hasAccessibleName(
                      control
                    )
                )
                .map(
                  control =>
                    control.id ||
                    control.tagName
                );

            return {
              formControls,
              editableRegions
            };
          }
        );

      expect(
        accessibilityIssues
      ).toEqual({
        formControls: [],
        editableRegions: []
      });

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
        settingsDialog.locator(
          `.settings-trip-row[data-trip-name="${tripName}"]`
        );

      await expect(
        tripRow
      ).toBeVisible();

            await tripRow
        .getByRole('button', {
          name: 'Dupliquer',
          exact: true
        })
        .click();

      const duplicateDialog =
        page.getByRole(
          'dialog',
          {
            name:
              'Dupliquer le voyage'
          }
        );

      await expect(
        duplicateDialog
      ).toBeVisible();

      const duplicateNameInput =
        duplicateDialog.getByLabel(
          'Nom de la copie',
          {
            exact: true
          }
        );

      await expect(
        duplicateNameInput
      ).toHaveValue(
        tripName + ' (copie)'
      );

      await duplicateNameInput.fill(
        duplicateTripName
      );

      await duplicateDialog
        .getByRole('button', {
          name: 'Créer la copie',
          exact: true
        })
        .click();

      await expect(
        duplicateDialog
      ).toBeHidden();

      await expect(
        page.getByText(
          duplicateTripName,
          {
            exact: true
          }
        ).first()
      ).toBeVisible();

      await page
        .getByRole('button', {
          name: 'Paramètres',
          exact: true
        })
        .click();

      await expect(
        settingsDialog
      ).toBeVisible();

      await settingsDialog
        .getByRole('button', {
          name: 'Mes voyages',
          exact: true
        })
        .click();

      const duplicateTripRow =
        settingsDialog.locator(
          `.settings-trip-row[data-trip-name="${duplicateTripName}"]`
        );

      await expect(
        duplicateTripRow
      ).toBeVisible();

      page.once(
        'dialog',
        async function confirmArchiving(
          confirmation
        ) {
          await confirmation.accept();
        }
      );

      await duplicateTripRow
        .getByRole('button', {
          name: 'Archiver',
          exact: true
        })
        .click();

      await expect(
        duplicateTripRow
          .getByText(
            'Archivé',
            {
              exact: true
            }
          )
      ).toBeVisible();

      await expect(
        duplicateTripRow
          .getByRole('button', {
            name: 'Ouvrir',
            exact: true
          })
      ).toHaveCount(0);

      await settingsDialog
        .getByLabel(
          'Filtrer les voyages',
          {
            exact: true
          }
        )
        .selectOption(
          'archived'
        );

      await expect(
        duplicateTripRow
      ).toBeVisible();

      await expect(
        tripRow
      ).toBeHidden();

      await duplicateTripRow
        .getByRole('button', {
          name: 'Restaurer',
          exact: true
        })
        .click();

      await expect(
        duplicateTripRow
          .getByRole('button', {
            name: 'Archiver',
            exact: true
          })
      ).toBeVisible();

      await settingsDialog
        .getByLabel(
          'Filtrer les voyages',
          {
            exact: true
          }
        )
        .selectOption(
          'all'
        );

      page.once(
        'dialog',
        async function confirmDuplicateDeletion(
          confirmation
        ) {
          await confirmation.accept();
        }
      );

      await duplicateTripRow
        .getByRole('button', {
          name: 'Supprimer',
          exact: true
        })
        .click();

      await expect(
        duplicateTripRow
      ).toBeHidden();

      await settingsDialog
        .getByRole('button', {
          name: 'Partage',
          exact: true
        })
        .click();

      await settingsDialog
        .getByLabel(
          'Droits accordés',
          {
            exact: true
          }
        )
        .selectOption('viewer');

      await settingsDialog
        .getByRole('button', {
          name: 'Créer le lien',
          exact: true
        })
        .click();

      const inviteRow =
        settingsDialog
          .locator(
            '.settings-invite-row'
          )
          .first();

      await expect(
        inviteRow
      ).toBeVisible();

      await expect(
        inviteRow
      ).toContainText(
        'Accès lecteur'
      );

      await expect(
        inviteRow
      ).toContainText(
        'une seule utilisation'
      );

      await expect(
        inviteRow.getByLabel(
          "Lien d'invitation viewer",
          {
            exact: true
          }
        )
      ).toHaveValue(
        /\?invite=/
      );

      await inviteRow
        .getByRole('button', {
          name: 'Révoquer',
          exact: true
        })
        .click();

      await expect(
        inviteRow
      ).toBeHidden();

      await expect(
        settingsDialog.getByText(
          'Aucun lien actif.',
          {
            exact: false
          }
        )
      ).toBeVisible();

      await settingsDialog
        .getByRole('button', {
          name: 'Rappels',
          exact: true
        })
        .click();

      await expect(
        settingsDialog.getByRole(
          'heading',
          {
            name: 'Ne rien oublier',
            exact: true
          }
        )
      ).toBeVisible();

      await settingsDialog
        .getByPlaceholder(
          'Ex. Réserver les billets du musée',
          {
            exact: true
          }
        )
        .fill(REMINDER_TITLE);

      await settingsDialog
        .getByRole('button', {
          name: 'Créer le rappel',
          exact: true
        })
        .click();

      const reminderRow =
        settingsDialog
          .locator('article')
          .filter({
            hasText:
              REMINDER_TITLE
          });

      await expect(
        reminderRow
      ).toBeVisible();

      await expect(
        reminderRow
      ).toContainText(
        tripName
      );

      await expect(
        settingsDialog.getByRole(
          'heading',
          {
            name: '1 rappel actif',
            exact: true
          }
        )
      ).toBeVisible();

      await reminderRow
        .getByRole('button', {
          name: 'Terminé',
          exact: true
        })
        .click();

      await expect(
        reminderRow.getByRole(
          'button',
          {
            name: 'Réactiver',
            exact: true
          }
        )
      ).toBeVisible();

      await reminderRow
        .getByRole('button', {
          name: 'Réactiver',
          exact: true
        })
        .click();

      await expect(
        reminderRow.getByRole(
          'button',
          {
            name: 'Terminé',
            exact: true
          }
        )
      ).toBeVisible();

      page.once(
        'dialog',
        async function confirmReminderDeletion(
          confirmation
        ) {
          await confirmation.accept();
        }
      );

      await reminderRow
        .getByRole('button', {
          name: 'Supprimer',
          exact: true
        })
        .click();

      await expect(
        reminderRow
      ).toBeHidden();

      await expect(
        settingsDialog.getByText(
          'Aucun rappel pour le moment.',
          {
            exact: true
          }
        )
      ).toBeVisible();

      await settingsDialog
        .getByRole('button', {
          name: 'Mes voyages',
          exact: true
        })
        .click();

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
            ''
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

test(
  'les droits lecteur et éditeur protègent réellement le voyage',
  async function collaborationRightsFlow(
    {
      page,
      browser
    },
    testInfo
  ) {
    test.skip(
      testInfo.project.name !==
        'desktop-chromium',
      'Le test de collaboration est exécuté une seule fois.'
    );

    test.skip(
      !TEST_EMAIL ||
        !TEST_PASSWORD ||
        !COLLABORATOR_EMAIL ||
        !COLLABORATOR_PASSWORD,
      'Les deux comptes E2E ne sont pas configurés.'
    );

    const tripName =
      TEST_TRIP_PREFIX +
      'COLLAB-' +
      Date.now();

    const viewerForbiddenNote =
      'E2E — modification lecteur interdite';

    const editorAllowedNote =
      'E2E — modification éditeur autorisée';

    const collaboratorContext =
      await browser.newContext();

    const collaboratorPage =
      await collaboratorContext.newPage();

    let ownerSignedIn = false;
    let collaboratorSignedIn = false;
    let tripId = '';

    try {
      await signInTestAccount(
        page,
        TEST_EMAIL,
        TEST_PASSWORD
      );

      ownerSignedIn = true;

      await removeTestTrips(
        page,
        ''
      );

      const createdTrip =
        await page.evaluate(
          async function createTestTrip({
            name
          }) {
            return window.SB.createTrip({
              name,
              startDate:
                '2026-10-05',
              endDate:
                '2026-10-06',
              days: 2
            });
          },
          {
            name: tripName
          }
        );

      tripId = createdTrip.id;

      const invitation =
        await page.evaluate(
          async function createViewerInvite({
            selectedTripId
          }) {
            const result =
              await window.SB
                .createTripInvite(
                  selectedTripId,
                  'viewer'
                );

            return {
              token: result.token
            };
          },
          {
            selectedTripId:
              tripId
          }
        );

      await signInTestAccount(
        collaboratorPage,
        COLLABORATOR_EMAIL,
        COLLABORATOR_PASSWORD
      );

      collaboratorSignedIn = true;

      await collaboratorPage.evaluate(
        async function acceptViewerInvite({
          token
        }) {
          await window.SB.acceptInvite(
            token
          );
        },
        {
          token:
            invitation.token
        }
      );

      const viewerAttempt =
        await collaboratorPage.evaluate(
          async function tryViewerUpdate({
            selectedTripId,
            forbiddenNote
          }) {
            try {
              const trip =
                await window.SB.loadTrip(
                  selectedTripId
                );

              const firstDay =
                trip?.days?.[0];

              if (!firstDay) {
                throw new Error(
                  'Journée de test introuvable.'
                );
              }

              await window.SB.updateDay(
                firstDay.id,
                {
                  note:
                    forbiddenNote
                }
              );

              return {
                blocked: false
              };
            } catch (error) {
              return {
                blocked: true,
                message:
                  error.message ||
                  String(error)
              };
            }
          },
          {
            selectedTripId:
              tripId,
            forbiddenNote:
              viewerForbiddenNote
          }
        );

      expect(
        viewerAttempt.blocked,
        'Un lecteur ne doit pas pouvoir modifier une journée.'
      ).toBe(true);

      const collaboratorMemberId =
        await page.evaluate(
          async function promoteCollaborator({
            selectedTripId,
            collaboratorEmail
          }) {
            const members =
              await window.SB
                .listTripMembers(
                  selectedTripId
                );

            const member =
              members.find(
                item =>
                  String(
                    item.email || ''
                  ).toLowerCase() ===
                  String(
                    collaboratorEmail
                  ).toLowerCase()
              );

            if (!member) {
              throw new Error(
                'Compte collaborateur introuvable dans les membres.'
              );
            }

            await window.SB
              .updateTripMemberRole(
                selectedTripId,
                member.id,
                'editor'
              );

            return member.id;
          },
          {
            selectedTripId:
              tripId,
            collaboratorEmail:
              COLLABORATOR_EMAIL
          }
        );

      const updatedNote =
        await collaboratorPage.evaluate(
          async function updateAsEditor({
            selectedTripId,
            allowedNote
          }) {
            const trip =
              await window.SB.loadTrip(
                selectedTripId
              );

            const firstDay =
              trip?.days?.[0];

            if (!firstDay) {
              throw new Error(
                'Journée de test introuvable.'
              );
            }

            const updatedDay =
              await window.SB.updateDay(
                firstDay.id,
                {
                  note:
                    allowedNote
                }
              );

            return updatedDay.note;
          },
          {
            selectedTripId:
              tripId,
            allowedNote:
              editorAllowedNote
          }
        );

      expect(
        updatedNote
      ).toBe(
        editorAllowedNote
      );

      await page.evaluate(
        async function transferOwnership({
          selectedTripId,
          memberId
        }) {
          await window.SB
            .transferTripOwnership(
              selectedTripId,
              memberId
            );
        },
        {
          selectedTripId:
            tripId,
          memberId:
            collaboratorMemberId
        }
      );

      const collaboratorIsOwner =
        await collaboratorPage.evaluate(
          async function verifyOwnership({
            selectedTripId
          }) {
            const user =
              await window.SB.getUser();

            const trips =
              await window.SB.listMyTrips({
                includeArchived: true
              });

            const trip =
              trips.find(
                item =>
                  String(item.id) ===
                  String(selectedTripId)
              );

            return Boolean(
              trip &&
              String(trip.owner_id) ===
                String(user?.id)
            );
          },
          {
            selectedTripId:
              tripId
          }
        );

      expect(
        collaboratorIsOwner,
        'Le transfert doit rendre le collaborateur propriétaire.'
      ).toBe(true);

      await page.evaluate(
        async function leaveTransferredTrip({
          selectedTripId
        }) {
          await window.SB.leaveTrip(
            selectedTripId
          );
        },
        {
          selectedTripId:
            tripId
        }
      );

      const formerOwnerStillHasAccess =
        await page.evaluate(
          async function verifyDeparture({
            selectedTripId
          }) {
            const trips =
              await window.SB.listMyTrips({
                includeArchived: true
              });

            return trips.some(
              item =>
                String(item.id) ===
                String(selectedTripId)
            );
          },
          {
            selectedTripId:
              tripId
          }
        );

      expect(
        formerOwnerStillHasAccess,
        'L’ancien propriétaire ne doit plus voir le voyage après l’avoir quitté.'
      ).toBe(false);

      await collaboratorPage.evaluate(
        async function deleteCollaborationTrip({
          selectedTripId
        }) {
          await window.SB.deleteTrip(
            selectedTripId
          );
        },
        {
          selectedTripId:
            tripId
        }
      );

      const tripStillExists =
        await collaboratorPage.evaluate(
          async function verifyDeletion({
            selectedTripId
          }) {
            const trips =
              await window.SB.listMyTrips({
                includeArchived: true
              });

            return trips.some(
              item =>
                String(item.id) ===
                String(selectedTripId)
            );
          },
          {
            selectedTripId:
              tripId
          }
        );

      expect(
        tripStillExists
      ).toBe(false);

      tripId = '';
    } finally {
      if (
        tripId &&
        collaboratorSignedIn
      ) {
        try {
          await collaboratorPage.evaluate(
            async function cleanupTrip({
              selectedTripId
            }) {
              await window.SB.deleteTrip(
                selectedTripId
              );
            },
            {
              selectedTripId:
                tripId
            }
          );
        } catch (cleanupError) {
          console.warn(
            'Nettoyage du voyage collaboratif impossible :',
            cleanupError
          );
        }
      }

      if (collaboratorSignedIn) {
        try {
          await collaboratorPage.evaluate(
            async function signOutCollaborator() {
              await window.SB.signOut();
            }
          );
        } catch (signOutError) {
          console.warn(
            'Déconnexion du collaborateur impossible :',
            signOutError
          );
        }
      }

      if (ownerSignedIn) {
        try {
          await page.evaluate(
            async function signOutOwner() {
              await window.SB.signOut();
            }
          );
        } catch (signOutError) {
          console.warn(
            'Déconnexion du propriétaire impossible :',
            signOutError
          );
        }
      }

      await collaboratorContext.close();
    }
  }
);