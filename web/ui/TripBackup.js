(function initTripBackup() {
  function safeFileDate() {
    const date = new Date();

    return [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(2, '0'),
      String(
        date.getDate()
      ).padStart(2, '0')
    ].join('-');
  }

  async function optionalList(
    loader
  ) {
    try {
      const result =
        await loader();

      return Array.isArray(result)
        ? result
        : [];
    } catch (error) {
      console.warn(
        'Optional backup data unavailable:',
        error
      );

      return [];
    }
  }

  function cleanDocument(
    documentItem
  ) {
    return {
      id: documentItem.id,
      category:
        documentItem.category,
      name: documentItem.name,
      mime: documentItem.mime,
      size: documentItem.size,
      createdAt:
        documentItem.createdAt
    };
  }

  function cleanMember(member) {
    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      email: member.email,
      name: member.name
    };
  }

  async function collectTrip(
    tripSummary
  ) {
    const trip =
      await window.SB.loadTrip(
        tripSummary.id
      );

    const [
      documents,
      members,
      activity
    ] = await Promise.all([
      optionalList(
        function loadDocuments() {
          return window.SB
            ?.listDocuments?.(
              trip.id
            );
        }
      ),

      optionalList(
        function loadMembers() {
          return window.SB
            ?.listTripMembers?.(
              trip.id
            );
        }
      ),

      optionalList(
        function loadActivity() {
          return window.SB
            ?.listTripActivity?.(
              trip.id,
              200
            );
        }
      )
    ]);

    return {
      ...trip,

      ownerId:
        tripSummary.owner_id ||
        null,

      updatedAt:
        tripSummary.updated_at ||
        null,

      archivedAt:
        tripSummary.archived_at ||
        null,

      documents:
        documents.map(
          cleanDocument
        ),

      collaboration: {
        members:
          members.map(
            cleanMember
          ),

        activity
      }
    };
  }

  async function downloadAll() {
    if (
      !window.SB?.listMyTrips ||
      !window.SB?.loadTrip
    ) {
      throw new Error(
        'La sauvegarde est indisponible.'
      );
    }

    const [
      user,
      tripSummaries
    ] = await Promise.all([
      window.SB
        .getUser?.(),

      window.SB
        .listMyTrips({
          includeArchived: true
        })
    ]);

    const trips = [];

    for (
      const tripSummary
      of tripSummaries
    ) {
      trips.push(
        await collectTrip(
          tripSummary
        )
      );
    }

    const backup = {
      format:
        'la-fabrique-voyages',

      version: 1,

      exportedAt:
        new Date()
          .toISOString(),

      account: user
        ? {
            id: user.id,
            email:
              user.email ||
              '',
            displayName:
              user.user_metadata
                ?.display_name ||
              ''
          }
        : null,

      notices: [
        'Cette sauvegarde contient des données personnelles.',
        'Les fichiers privés ne sont pas inclus.',
        'Les métadonnées des documents permettent de les identifier.'
      ],

      trips
    };

    const content =
      JSON.stringify(
        backup,
        null,
        2
      );

    const blob =
      new Blob(
        [content],
        {
          type:
            'application/json;charset=utf-8'
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        'a'
      );

    link.href = url;

    link.download =
      'la-fabrique-voyages-' +
      safeFileDate() +
      '.json';

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    window.setTimeout(
      function releaseBackupUrl() {
        URL.revokeObjectURL(
          url
        );
      },
      1000
    );

    return {
      tripCount:
        trips.length,

      fileName:
        link.download
    };
  }

  function safeDate(value) {
    const cleanValue =
      String(value || '');

    return /^\d{4}-\d{2}-\d{2}$/
      .test(cleanValue)
      ? cleanValue
      : null;
  }

  function safeHttpUrl(value) {
    const cleanValue =
      String(value || '')
        .trim();

    return /^https?:\/\//i
      .test(cleanValue)
      ? cleanValue
      : '';
  }

  function validateBackup(
    backup
  ) {
    if (
      !backup ||
      typeof backup !==
        'object' ||
      backup.format !==
        'la-fabrique-voyages' ||
      backup.version !== 1
    ) {
      throw new Error(
        'Ce fichier n’est pas une sauvegarde compatible.'
      );
    }

    if (
      !Array.isArray(
        backup.trips
      ) ||
      !backup.trips.length
    ) {
      throw new Error(
        'Cette sauvegarde ne contient aucun voyage.'
      );
    }

    if (
      backup.trips.length >
      50
    ) {
      throw new Error(
        'La sauvegarde contient trop de voyages.'
      );
    }

    let totalSteps = 0;

    backup.trips.forEach(
      function checkTrip(trip) {
        const days =
          Array.isArray(
            trip.days
          )
            ? trip.days
            : [];

        if (days.length > 90) {
          throw new Error(
            'Un voyage dépasse la limite de 90 journées.'
          );
        }

        days.forEach(
          function countSteps(
            day
          ) {
            totalSteps +=
              Array.isArray(
                day.steps
              )
                ? day.steps
                    .length
                : 0;
          }
        );
      }
    );

    if (totalSteps > 5000) {
      throw new Error(
        'La sauvegarde contient trop d’étapes.'
      );
    }

    return backup.trips;
  }

  function restoredTripName(
    value
  ) {
    const cleanName =
      String(
        value ||
        'Voyage'
      )
        .trim()
        .slice(0, 100);

    return (
      cleanName +
      ' (restauré)'
    );
  }

  async function restoreTrip(
    sourceTrip
  ) {
    const sourceDays =
      Array.isArray(
        sourceTrip.days
      )
        ? sourceTrip.days
        : [];

    let createdTrip = null;

    try {
      createdTrip =
        await window.SB
          .createTrip({
            name:
              restoredTripName(
                sourceTrip.name
              ),

            startDate:
              safeDate(
                sourceTrip
                  .startDate
              ),

            endDate:
              safeDate(
                sourceTrip
                  .endDate
              ),

            days: Math.max(
              1,
              sourceDays.length
            )
          });

      await window.SB
        .updateTrip(
          createdTrip.id,
          {
            globalNote:
              String(
                sourceTrip
                  .globalNote ||
                ''
              ),

            accentTheme:
              String(
                sourceTrip
                  .accentTheme ||
                'ochre'
              )
          }
        );

      const tripCoverUrl =
        safeHttpUrl(
          sourceTrip
            .coverImageUrl
        );

      if (
        tripCoverUrl &&
        window.SB
          ?.saveTripCover
      ) {
        await window.SB
          .saveTripCover(
            createdTrip.id,
            {
              imageUrl:
                tripCoverUrl,

              alt:
                sourceTrip
                  .coverImageAlt,

              photographer:
                sourceTrip
                  .coverPhotographerName,

              photographerUrl:
                safeHttpUrl(
                  sourceTrip
                    .coverPhotographerUrl
                ),

              sourceUrl:
                safeHttpUrl(
                  sourceTrip
                    .coverSourceUrl
                )
            }
          );
      }

      const targetTrip =
        await window.SB
          .loadTrip(
            createdTrip.id
          );

      const targetDays =
        Array.isArray(
          targetTrip.days
        )
          ? targetTrip.days
          : [];

      const stepIdMap =
        new Map();

      for (
        let dayIndex = 0;
        dayIndex <
          sourceDays.length;
        dayIndex += 1
      ) {
        const sourceDay =
          sourceDays[dayIndex];

        const targetDay =
          targetDays[dayIndex];

        if (!targetDay) {
          throw new Error(
            'Une journée restaurée est introuvable.'
          );
        }

        await window.SB
          .updateDay(
            targetDay.id,
            {
              title:
                String(
                  sourceDay
                    .title ||
                  ''
                ),

              note:
                String(
                  sourceDay
                    .note ||
                  ''
                ),

              dateLabel:
                String(
                  sourceDay
                    .dateLabel ||
                  ''
                ),

              dateISO:
                safeDate(
                  sourceDay
                    .dateISO
                ),

              todo:
                Array.isArray(
                  sourceDay.todo
                )
                  ? sourceDay.todo
                      .map(
                        item =>
                          String(item)
                      )
                  : []
            }
          );

        const dayCoverUrl =
          safeHttpUrl(
            sourceDay
              .coverImageUrl
          );

        if (
          dayCoverUrl &&
          window.SB
            ?.saveDayCover
        ) {
          await window.SB
            .saveDayCover(
              targetDay.id,
              {
                imageUrl:
                  dayCoverUrl,

                alt:
                  sourceDay
                    .coverImageAlt,

                photographer:
                  sourceDay
                    .coverPhotographerName,

                photographerUrl:
                  safeHttpUrl(
                    sourceDay
                      .coverPhotographerUrl
                  ),

                sourceUrl:
                  safeHttpUrl(
                    sourceDay
                      .coverSourceUrl
                  )
              }
            );

          await window.SB
            .updateDayCoverCrop?.(
              targetDay.id,
              {
                positionY:
                  sourceDay
                    .coverPositionY,

                locked:
                  sourceDay
                    .coverCropLocked
              }
            );
        }

        const orderedSteps = (
          Array.isArray(
            sourceDay.steps
          )
            ? sourceDay.steps
            : []
        )
          .slice()
          .sort(
            (
              first,
              second
            ) =>
              Number(
                first
                  .stepIndex ||
                  0
              ) -
              Number(
                second
                  .stepIndex ||
                  0
              )
          );

        for (
          let stepIndex = 0;
          stepIndex <
            orderedSteps.length;
          stepIndex += 1
        ) {
          const sourceStep =
            orderedSteps[
              stepIndex
            ];

          const savedStep =
            await window.SB
              .saveStep(
                createdTrip.id,
                targetDay.id,
                {
                  ...sourceStep,
                  id: null,
                  dayId:
                    targetDay.id,
                  stepIndex,
                  link:
                    safeHttpUrl(
                      sourceStep
                        .link
                    )
                }
              );

          if (
            sourceStep.id &&
            savedStep?.id
          ) {
            stepIdMap.set(
              String(
                sourceStep.id
              ),
              savedStep.id
            );
          }
        }
      }

      const participants =
        Array.isArray(
          sourceTrip
            .participants
        )
          ? sourceTrip
              .participants
          : [];

      for (
        let index = 0;
        index <
          participants.length;
        index += 1
      ) {
        const participantName =
          String(
            participants[index]
              ?.name ||
            ''
          ).trim();

        if (
          participantName &&
          window.SB
            ?.addParticipant
        ) {
          await window.SB
            .addParticipant(
              createdTrip.id,
              participantName,
              index
            );
        }
      }

      const budgetItems =
        Array.isArray(
          sourceTrip.budget
        )
          ? sourceTrip.budget
          : [];

      for (
        const sourceItem
        of budgetItems
      ) {
        const restoredStepId =
          sourceItem.stepId
            ? stepIdMap.get(
                String(
                  sourceItem.stepId
                )
              ) || null
            : null;

        await window.SB
          .saveBudgetItem(
            createdTrip.id,
            {
              ...sourceItem,
              id: null,
              stepId:
                restoredStepId
            }
          );
      }

            if (
        sourceTrip.archivedAt &&
        window.SB
          ?.setTripArchived
      ) {
        await window.SB
          .setTripArchived(
            createdTrip.id,
            true
          );
      }

      return await window.SB
        .loadTrip(
          createdTrip.id
        );
    } catch (error) {
      if (createdTrip?.id) {
        try {
          await window.SB
            .deleteTrip(
              createdTrip.id
            );
        } catch (
          cleanupError
        ) {
          console.warn(
            'Restore cleanup failed:',
            cleanupError
          );
        }
      }

      throw error;
    }
  }

  async function restoreFile(
    file
  ) {
    if (!file) {
      throw new Error(
        'Choisis un fichier de sauvegarde.'
      );
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      throw new Error(
        'Le fichier dépasse la limite de 10 Mo.'
      );
    }

    let backup;

    try {
      backup =
        JSON.parse(
          await file.text()
        );
    } catch (error) {
      throw new Error(
        'Le fichier JSON est illisible.'
      );
    }

    const sourceTrips =
      validateBackup(
        backup
      );

    const confirmed =
      window.confirm(
        [
          'Restaurer ',
          sourceTrips.length,
          sourceTrips.length > 1
            ? ' voyages ?'
            : ' voyage ?',
          '\n\n',
          'De nouvelles copies seront créées.',
          '\n',
          'Aucun voyage existant ne sera remplacé.',
          '\n',
          'Les documents et collaborateurs ne seront pas restaurés.'
        ].join('')
      );

    if (!confirmed) {
      return {
        cancelled: true,
        tripCount: 0
      };
    }

    const restoredTrips = [];

    try {
      for (
        const sourceTrip
        of sourceTrips
      ) {
        restoredTrips.push(
          await restoreTrip(
            sourceTrip
          )
        );
      }
    } catch (error) {
      for (
        const restoredTrip
        of restoredTrips
      ) {
        try {
          await window.SB
            .deleteTrip(
              restoredTrip.id
            );
        } catch (
          cleanupError
        ) {
          console.warn(
            'Batch restore cleanup failed:',
            cleanupError
          );
        }
      }

      throw error;
    }

    return {
      cancelled: false,
      tripCount:
        restoredTrips.length,
      trips:
        restoredTrips
    };
  }

  window.TripBackup = {
    downloadAll,
    restoreFile
  };
})();