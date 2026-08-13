(function initReminders() {
  function defaultReminderTime() {
    const date = new Date(
      Date.now() + 60 * 60 * 1000
    );

    date.setSeconds(0, 0);

    const timezoneOffset =
      date.getTimezoneOffset() *
      60 *
      1000;

    return new Date(
      date.getTime() - timezoneOffset
    )
      .toISOString()
      .slice(0, 16);
  }

  function formatReminderDate(value) {
    if (!value) {
      return 'Date inconnue';
    }

    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    ).format(new Date(value));
  }

  function notificationPermission() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    return window.Notification.permission;
  }

  function RemindersSection({
    trips = [],
    activeTripId
  }) {
    const availableTrips =
      trips.filter(
        trip => !trip.archived_at
      );

    const [
      tripId,
      setTripId
    ] = React.useState(
      activeTripId ||
      availableTrips[0]?.id ||
      ''
    );

    const [
      title,
      setTitle
    ] = React.useState('');

    const [
      remindAt,
      setRemindAt
    ] = React.useState(
      defaultReminderTime
    );

    const [
      reminders,
      setReminders
    ] = React.useState([]);

    const [
      loading,
      setLoading
    ] = React.useState(true);

    const [
      busy,
      setBusy
    ] = React.useState(false);

    const [
      error,
      setError
    ] = React.useState('');

    const [
      permission,
      setPermission
    ] = React.useState(
      notificationPermission
    );

    React.useEffect(() => {
      if (
        tripId &&
        availableTrips.some(
          trip => trip.id === tripId
        )
      ) {
        return;
      }

      setTripId(
        activeTripId ||
        availableTrips[0]?.id ||
        ''
      );
    }, [
      trips,
      activeTripId,
      tripId
    ]);

    React.useEffect(() => {
      let cancelled = false;

      setLoading(true);

      window.SB
        .listMyReminders()
        .then(nextReminders => {
          if (!cancelled) {
            setReminders(
              nextReminders
            );
          }
        })
        .catch(loadError => {
          if (!cancelled) {
            setError(
              loadError.message ||
              'Chargement impossible.'
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }, []);

    async function createReminder(
      event
    ) {
      event.preventDefault();
      setError('');

      const cleanTitle =
        title.trim();

      if (!tripId) {
        setError(
          'Choisis un voyage.'
        );
        return;
      }

      if (!cleanTitle) {
        setError(
          'Écris le contenu du rappel.'
        );
        return;
      }

      const reminderDate =
        new Date(remindAt);

      if (
        !remindAt ||
        Number.isNaN(
          reminderDate.getTime()
        )
      ) {
        setError(
          'Choisis une date valide.'
        );
        return;
      }

      if (
        reminderDate.getTime() <=
        Date.now()
      ) {
        setError(
          'Le rappel doit être programmé dans le futur.'
        );
        return;
      }

      setBusy(true);

      try {
        const reminder =
          await window.SB
            .createTripReminder({
              tripId,
              title: cleanTitle,
              remindAt
            });

        setReminders(current => (
          [...current, reminder]
            .sort(
              (first, second) =>
                new Date(
                  first.remindAt
                ) -
                new Date(
                  second.remindAt
                )
            )
        ));

        setTitle('');
        setRemindAt(
          defaultReminderTime()
        );

        Store.showToast(
          'Rappel enregistré.'
        );
      } catch (createError) {
        setError(
          createError.message ||
          'Création impossible.'
        );
      } finally {
        setBusy(false);
      }
    }

    async function toggleReminder(
      reminder
    ) {
      if (busy) return;

      const completed =
        !reminder.completedAt;

      setBusy(true);
      setError('');

      try {
        await window.SB
          .setReminderCompleted(
            reminder.id,
            completed
          );

        setReminders(current =>
          current.map(item => (
            item.id === reminder.id
              ? {
                  ...item,
                  completedAt:
                    completed
                      ? new Date()
                          .toISOString()
                      : null,
                  notifiedAt:
                    completed
                      ? item.notifiedAt
                      : null
                }
              : item
          ))
        );

        Store.showToast(
          completed
            ? 'Rappel terminé.'
            : 'Rappel réactivé.'
        );
      } catch (updateError) {
        setError(
          updateError.message ||
          'Modification impossible.'
        );
      } finally {
        setBusy(false);
      }
    }

    async function removeReminder(
      reminder
    ) {
      if (
        busy ||
        !confirm(
          `Supprimer le rappel « ${reminder.title} » ?`
        )
      ) {
        return;
      }

      setBusy(true);
      setError('');

      try {
        await window.SB
          .deleteReminder(
            reminder.id
          );

        setReminders(current =>
          current.filter(
            item =>
              item.id !== reminder.id
          )
        );

        Store.showToast(
          'Rappel supprimé.'
        );
      } catch (deleteError) {
        setError(
          deleteError.message ||
          'Suppression impossible.'
        );
      } finally {
        setBusy(false);
      }
    }

    async function enableNotifications() {
      if (
        !('Notification' in window)
      ) {
        setPermission(
          'unsupported'
        );
        return;
      }

      try {
        const result =
          await window.Notification
            .requestPermission();

        setPermission(result);

        if (result === 'granted') {
          Store.showToast(
            'Notifications autorisées.'
          );
        } else if (
          result === 'denied'
        ) {
          setError(
            'Les notifications sont bloquées dans les réglages du navigateur.'
          );
        }
      } catch (permissionError) {
        setError(
          'Impossible d’activer les notifications.'
        );
      }
    }

    const pendingCount =
      reminders.filter(
        reminder =>
          !reminder.completedAt
      ).length;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}
      >
        <SettingsCard
          eyebrow="Notifications"
          title="Recevoir mes rappels"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              flexWrap: 'wrap',
              gap: 14
            }}
          >
            <div
              style={{
                maxWidth: 560,
                color: 'var(--muted)',
                fontSize: 13,
                lineHeight: 1.5
              }}
            >
              Les rappels apparaissent dans
              l’application. Tu peux aussi
              autoriser les notifications du
              navigateur.
            </div>

            {permission ===
              'granted' ? (
              <div
                style={{
                  color: '#27644f',
                  fontSize: 13,
                  fontWeight: 800
                }}
              >
                Notifications autorisées
              </div>
            ) : permission ===
              'unsupported' ? (
              <div
                style={{
                  color: 'var(--muted)',
                  fontSize: 13
                }}
              >
                Navigateur non compatible
              </div>
            ) : (
              <SettingsButton
                icon="shield"
                onClick={
                  enableNotifications
                }
              >
                Autoriser les notifications
              </SettingsButton>
            )}
          </div>
        </SettingsCard>

        <SettingsCard
          eyebrow="Nouveau rappel"
          title="Ne rien oublier"
        >
          <form
            onSubmit={createReminder}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 12
              }}
            >
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7,
                  fontSize: 12,
                  fontWeight: 800
                }}
              >
                Voyage

                <select
                  value={tripId}
                  onChange={event =>
                    setTripId(
                      event.target.value
                    )
                  }
                  style={
                    settingsInputStyle
                  }
                >
                  {!availableTrips.length && (
                    <option value="">
                      Aucun voyage disponible
                    </option>
                  )}

                  {availableTrips.map(
                    trip => (
                      <option
                        key={trip.id}
                        value={trip.id}
                      >
                        {trip.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7,
                  fontSize: 12,
                  fontWeight: 800
                }}
              >
                Date et heure

                <input
                  type="datetime-local"
                  value={remindAt}
                  onChange={event =>
                    setRemindAt(
                      event.target.value
                    )
                  }
                  style={
                    settingsInputStyle
                  }
                />
              </label>
            </div>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
                fontSize: 12,
                fontWeight: 800
              }}
            >
              Ce qu’il faut rappeler

              <input
                value={title}
                maxLength={160}
                onChange={event =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="Ex. Réserver les billets du musée"
                style={
                  settingsInputStyle
                }
              />
            </label>

            <div>
              <SettingsButton
                type="submit"
                variant="primary"
                icon="plus"
                disabled={
                  busy ||
                  !availableTrips.length
                }
              >
                {busy
                  ? 'Enregistrement…'
                  : 'Créer le rappel'}
              </SettingsButton>
            </div>
          </form>
        </SettingsCard>

        <SettingsCard
          eyebrow="À surveiller"
          title={
            pendingCount === 1
              ? '1 rappel actif'
              : `${pendingCount} rappels actifs`
          }
        >
          {loading ? (
            <div
              role="status"
              style={{
                color: 'var(--muted)',
                fontSize: 13
              }}
            >
              Chargement des rappels…
            </div>
          ) : !reminders.length ? (
            <div
              role="status"
              style={{
                padding: '20px 8px',
                color: 'var(--muted)',
                textAlign: 'center',
                fontSize: 13
              }}
            >
              Aucun rappel pour le moment.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 9
              }}
            >
              {reminders.map(
                reminder => (
                  <article
                    key={reminder.id}
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      padding: 13,
                      border:
                        '1px solid var(--line)',
                      borderRadius: 10,
                      background:
                        'var(--card)',
                      opacity:
                        reminder.completedAt
                          ? 0.65
                          : 1
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                        flex: '1 1 220px'
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 900,
                          textDecoration:
                            reminder.completedAt
                              ? 'line-through'
                              : 'none'
                        }}
                      >
                        {reminder.title}
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          color:
                            'var(--muted)',
                          fontSize: 12
                        }}
                      >
                        {reminder.tripName}
                        {' · '}
                        {formatReminderDate(
                          reminder.remindAt
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 7
                      }}
                    >
                      <SettingsButton
                        icon={
                          reminder.completedAt
                            ? 'clock'
                            : 'check'
                        }
                        disabled={busy}
                        onClick={() =>
                          toggleReminder(
                            reminder
                          )
                        }
                      >
                        {reminder.completedAt
                          ? 'Réactiver'
                          : 'Terminé'}
                      </SettingsButton>

                      <SettingsButton
                        variant="danger"
                        icon="x"
                        disabled={busy}
                        onClick={() =>
                          removeReminder(
                            reminder
                          )
                        }
                      >
                        Supprimer
                      </SettingsButton>
                    </div>
                  </article>
                )
              )}
            </div>
          )}

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 13,
                padding: '10px 12px',
                borderRadius: 8,
                color: '#b64f38',
                background:
                  'rgba(192, 86, 63, .10)',
                fontSize: 12,
                fontWeight: 700
              }}
            >
              {error}
            </div>
          )}
        </SettingsCard>
      </div>
    );
  }

  function ReminderNotifier({
    user
  }) {
    React.useEffect(() => {
      if (!user) {
        return undefined;
      }

      let cancelled = false;
      let checking = false;

      async function checkReminders() {
        if (
          cancelled ||
          checking ||
          document.visibilityState ===
            'hidden'
        ) {
          return;
        }

        checking = true;

        try {
          const dueReminders =
            await window.SB
              .listDueReminders();

          if (
            cancelled ||
            !dueReminders.length
          ) {
            return;
          }

          const first =
            dueReminders[0];

          Store.showToast(
            dueReminders.length === 1
              ? `Rappel : ${first.title}`
              : `${dueReminders.length} rappels sont arrivés à échéance.`
          );

          if (
            'Notification' in window &&
            window.Notification
              .permission ===
              'granted'
          ) {
            dueReminders.forEach(
              reminder => {
                try {
                  new window.Notification(
                    'La Fabrique à Voyages',
                    {
                      body:
                        reminder.title +
                        ' · ' +
                        reminder.tripName,
                      icon:
                        '/icons/app-icon-192.svg',
                      tag:
                        'trip-reminder-' +
                        reminder.id
                    }
                  );
                } catch (
                  notificationError
                ) {
                  console.warn(
                    'Notification impossible :',
                    notificationError
                  );
                }
              }
            );
          }

          await Promise.allSettled(
            dueReminders.map(
              reminder =>
                window.SB
                  .markReminderNotified(
                    reminder.id
                  )
            )
          );
        } catch (checkError) {
          console.warn(
            'Vérification des rappels impossible :',
            checkError
          );
        } finally {
          checking = false;
        }
      }

      function checkWhenVisible() {
        if (
          document.visibilityState ===
          'visible'
        ) {
          checkReminders();
        }
      }

      checkReminders();

      const intervalId =
        window.setInterval(
          checkReminders,
          60 * 1000
        );

      document.addEventListener(
        'visibilitychange',
        checkWhenVisible
      );

      return () => {
        cancelled = true;

        window.clearInterval(
          intervalId
        );

        document.removeEventListener(
          'visibilitychange',
          checkWhenVisible
        );
      };
    }, [user?.id]);

    return null;
  }

  window.RemindersSection =
    RemindersSection;

  window.ReminderNotifier =
    ReminderNotifier;
})();