(function initTripSummary() {
  const Icon = window.Icon;

  const TRANSPORT_META = {
    train: {
      label: 'Train',
      icon: 'train'
    },
    avion: {
      label: 'Avion',
      icon: 'avion'
    },
    bus: {
      label: 'Bus',
      icon: 'bus'
    },
    voiture: {
      label: 'Voiture',
      icon: 'car'
    },
    ferry: {
      label: 'Ferry',
      icon: 'ferry'
    },
    metro: {
      label: 'Métro',
      icon: 'metro'
    },
    pied: {
      label: 'À pied',
      icon: 'walk'
    },
    taxi: {
      label: 'Taxi',
      icon: 'car'
    },
    autre: {
      label: 'Autre',
      icon: 'route'
    }
  };

  const STEP_META = {
    activite: {
      label: 'Activités',
      icon: 'camera'
    },
    restaurant: {
      label: 'Restaurants',
      icon: 'fork'
    },
    logement: {
      label: 'Hébergements',
      icon: 'bed'
    },
    transport: {
      label: 'Transports',
      icon: 'route'
    },
    autre: {
      label: 'Autres étapes',
      icon: 'pin'
    }
  };

  function safeArray(value) {
    return Array.isArray(value)
      ? value
      : [];
  }

  function safeText(value) {
    return String(
      value == null
        ? ''
        : value
    ).trim();
  }

  function parseLocalDate(value) {
    if (!value) return null;

    const date = new Date(
      String(value) + 'T12:00:00'
    );

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  function formatDate(value) {
    const date = parseLocalDate(value);

    if (!date) return '';

    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    ).format(date);
  }

  function formatMoney(value) {
    return new Intl.NumberFormat(
      'fr-FR',
      {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
      }
    ).format(Number(value) || 0);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat(
      'fr-FR'
    ).format(Number(value) || 0);
  }

  function calculateDateDuration(
    startValue,
    endValue
  ) {
    const start =
      parseLocalDate(startValue);

    const end =
      parseLocalDate(endValue);

    if (!start || !end) return 0;

    return Math.max(
      0,
      Math.round(
        (end - start) / 86400000
      )
    );
  }

  function calculateLodgingNights(step) {
    const dateDuration =
      calculateDateDuration(
        step.dateStart,
        step.dateEnd
      );

    if (dateDuration > 0) {
      return dateDuration;
    }

    return Math.max(
      0,
      Number(
        step.nuits ||
        step.nights ||
        0
      )
    );
  }

  function createBreakdown(
    values,
    labelBuilder
  ) {
    const counts = new Map();

    values.forEach(function countValue(value) {
      const key =
        safeText(value) || 'autre';

      counts.set(
        key,
        (counts.get(key) || 0) + 1
      );
    });

    return Array
      .from(counts.entries())
      .map(function createItem(entry) {
        return {
          id: entry[0],
          label: labelBuilder(entry[0]),
          value: entry[1]
        };
      })
      .sort(function sortItems(
        first,
        second
      ) {
        return second.value - first.value;
      });
  }

  function createSummary(trip) {
    const days =
      safeArray(trip?.days);

    const steps =
      days.flatMap(function readDay(day) {
        return safeArray(day.steps).map(
          function enrichStep(step) {
            return {
              ...step,
              day
            };
          }
        );
      });

    const transports =
      steps.filter(
        step =>
          safeText(step.type)
            .toLowerCase() ===
          'transport'
      );

    const lodgings =
      steps.filter(
        step =>
          safeText(step.type)
            .toLowerCase() ===
          'logement'
      );

    const budget =
      safeArray(trip?.budget);

    const participants =
      safeArray(trip?.participants);

    const locations = new Map();

    steps.forEach(function collectLocations(
      step
    ) {
      [
        step.lieu,
        step.depart,
        step.arrivee
      ]
        .map(safeText)
        .filter(Boolean)
        .forEach(function addLocation(
          location
        ) {
          const key =
            location.toLocaleLowerCase(
              'fr-FR'
            );

          if (!locations.has(key)) {
            locations.set(
              key,
              location
            );
          }
        });
    });

    const totalBudget =
      budget.reduce(
        function addBudget(total, item) {
          return (
            total +
            (Number(item.amount) || 0)
          );
        },
        0
      );

    const totalNights =
      lodgings.reduce(
        function addNights(total, step) {
          return (
            total +
            calculateLodgingNights(step)
          );
        },
        0
      );

    const transportBreakdown =
      createBreakdown(
        transports.map(
          step =>
            safeText(
              step.transportType
            ).toLowerCase() ||
            'autre'
        ),
        function transportLabel(type) {
          return (
            TRANSPORT_META[type] ||
            TRANSPORT_META.autre
          ).label;
        }
      ).map(function addTransportIcon(
        item
      ) {
        return {
          ...item,
          icon:
            (
              TRANSPORT_META[item.id] ||
              TRANSPORT_META.autre
            ).icon
        };
      });

    const stepBreakdown =
      createBreakdown(
        steps.map(
          step =>
            safeText(step.type)
              .toLowerCase() ||
            'autre'
        ),
        function stepLabel(type) {
          return (
            STEP_META[type] ||
            STEP_META.autre
          ).label;
        }
      ).map(function addStepIcon(item) {
        return {
          ...item,
          icon:
            (
              STEP_META[item.id] ||
              STEP_META.autre
            ).icon
        };
      });

    const budgetTotals = new Map();

    budget.forEach(function collectBudget(
      item
    ) {
      const category =
        safeText(item.cat) ||
        'Divers';

      budgetTotals.set(
        category,
        (
          budgetTotals.get(category) ||
          0
        ) +
        (Number(item.amount) || 0)
      );
    });

    const budgetBreakdown =
      Array
        .from(budgetTotals.entries())
        .map(function createBudgetItem(
          entry
        ) {
          return {
            id: entry[0],
            label: entry[0],
            value: entry[1]
          };
        })
        .sort(function sortBudget(
          first,
          second
        ) {
          return second.value - first.value;
        });

    const lodgingTotals = new Map();

    lodgings.forEach(
      function collectLodging(step) {
        const name =
          safeText(
            step.label ||
            step.lieu
          ) ||
          'Hébergement';

        const key =
          name.toLocaleLowerCase(
            'fr-FR'
          );

        const current =
          lodgingTotals.get(key) || {
            name,
            nights: 0
          };

        current.nights +=
          calculateLodgingNights(step);

        lodgingTotals.set(
          key,
          current
        );
      }
    );

    const lodgingBreakdown =
      Array
        .from(lodgingTotals.values())
        .sort(function sortLodgings(
          first,
          second
        ) {
          return (
            second.nights -
            first.nights
          );
        });

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const datedDays =
      days.filter(day => day.dateISO);

    const elapsedDays =
      datedDays.filter(
        day => day.dateISO <= today
      ).length;

    const progress =
      datedDays.length
        ? Math.round(
            (
              elapsedDays /
              datedDays.length
            ) *
            100
          )
        : 0;

    const plannedDays =
      days.filter(
        day =>
          safeArray(day.steps).length > 0
      ).length;

    const notesCount =
      (
        safeText(trip?.globalNote)
          ? 1
          : 0
      ) +
      days.filter(
        day => safeText(day.note)
      ).length +
      steps.filter(
        step => safeText(step.note)
      ).length;

    const importantCount =
      steps.filter(
        step => Boolean(step.important)
      ).length;

    const reservationCount =
      steps.filter(
        step => safeText(step.ref)
      ).length;

    const startDate =
      trip?.startDate ||
      days[0]?.dateISO ||
      '';

    const endDate =
      trip?.endDate ||
      days[days.length - 1]
        ?.dateISO ||
      '';

    let statusLabel =
      'Voyage en préparation';

    if (
      startDate &&
      endDate &&
      today > endDate
    ) {
      statusLabel =
        'Voyage terminé';
    } else if (
      startDate &&
      endDate &&
      today >= startDate &&
      today <= endDate
    ) {
      statusLabel =
        'Voyage en cours';
    } else if (
      startDate &&
      today < startDate
    ) {
      statusLabel =
        'Prochain départ';
    }

    const dayCount =
      days.length ||
      (
        calculateDateDuration(
          startDate,
          endDate
        ) + 1
      );

    return {
      days,
      steps,
      transports,
      lodgings,
      participants,
      locations:
        Array.from(
          locations.values()
        ),
      totalBudget,
      totalNights,
      transportBreakdown,
      stepBreakdown,
      budgetBreakdown,
      lodgingBreakdown,
      progress,
      plannedDays,
      notesCount,
      importantCount,
      reservationCount,
      startDate,
      endDate,
      statusLabel,
      dayCount
    };
  }

  function StatCard({
    icon,
    value,
    label,
    detail
  }) {
    return (
      <article className="trip-summary-stat">
        <span className="trip-summary-stat-icon">
          <Icon
            name={icon}
            size={20}
          />
        </span>

        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>

        {detail && (
          <small>
            {detail}
          </small>
        )}
      </article>
    );
  }

  function Breakdown({
    title,
    subtitle,
    items,
    formatter,
    emptyText
  }) {
    const maximum =
      Math.max(
        1,
        ...items.map(
          item => Number(item.value) || 0
        )
      );

    return (
      <section className="trip-summary-panel">
        <header className="trip-summary-panel-heading">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
        </header>

        {items.length === 0 ? (
          <div className="trip-summary-empty">
            {emptyText}
          </div>
        ) : (
          <div className="trip-summary-bars">
            {items.map(
              function renderItem(item) {
                const percent =
                  Math.max(
                    4,
                    (
                      Number(item.value) /
                      maximum
                    ) *
                    100
                  );

                return (
                  <div
                    className="trip-summary-bar-row"
                    key={item.id}
                  >
                    <div className="trip-summary-bar-label">
                      <span>
                        {item.icon && (
                          <Icon
                            name={item.icon}
                            size={16}
                          />
                        )}

                        {item.label}
                      </span>

                      <strong>
                        {formatter
                          ? formatter(
                              item.value
                            )
                          : formatNumber(
                              item.value
                            )}
                      </strong>
                    </div>

                    <div className="trip-summary-bar-track">
                      <span
                        style={{
                          width:
                            percent + '%'
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>
    );
  }

  function TripSummaryView() {
    const trip =
      Store.useStore(
        function selectTrip(state) {
          return state.trip;
        }
      );

    const summary =
      React.useMemo(
        function prepareSummary() {
          return createSummary(trip);
        },
        [trip]
      );

    if (!trip) return null;

    const dateRange =
      [
        formatDate(
          summary.startDate
        ),
        formatDate(
          summary.endDate
        )
      ]
        .filter(Boolean)
        .join(' — ');

    return (
      <div className="trip-summary-view">
        <div className="trip-summary-content">
          <section
            className={
              'trip-summary-hero' +
              (
                trip.coverImageUrl
                  ? ' has-cover'
                  : ''
              )
            }
          >
            {trip.coverImageUrl && (
              <img
                className="trip-summary-cover"
                src={trip.coverImageUrl}
                alt=""
              />
            )}

            <div className="trip-summary-hero-overlay" />

            <div className="trip-summary-hero-content">
              <span className="trip-summary-kicker">
                <Icon
                  name="sparkle"
                  size={15}
                />

                Bilan du voyage
              </span>

              <h1>
                {trip.name ||
                  'Mon voyage'}
              </h1>

              {dateRange && (
                <p>{dateRange}</p>
              )}

              <span className="trip-summary-status">
                {summary.statusLabel}
              </span>
            </div>
          </section>

          <section
            className="trip-summary-progress"
            aria-label={
              'Progression du voyage : ' +
              summary.progress +
              '%'
            }
          >
            <div>
              <span>
                Progression temporelle
              </span>

              <strong>
                {summary.progress} %
              </strong>
            </div>

            <div className="trip-summary-progress-track">
              <span
                style={{
                  width:
                    summary.progress +
                    '%'
                }}
              />
            </div>
          </section>

          <section className="trip-summary-stats">
            <StatCard
              icon="cal"
              value={formatNumber(
                summary.dayCount
              )}
              label="jours"
              detail={
                summary.plannedDays +
                ' jour' +
                (
                  summary.plannedDays > 1
                    ? 's'
                    : ''
                ) +
                ' organisé' +
                (
                  summary.plannedDays > 1
                    ? 's'
                    : ''
                )
              }
            />

            <StatCard
              icon="moon"
              value={formatNumber(
                summary.totalNights
              )}
              label="nuits"
              detail={
                summary.lodgingBreakdown
                  .length +
                ' hébergement' +
                (
                  summary.lodgingBreakdown
                    .length > 1
                    ? 's'
                    : ''
                )
              }
            />

            <StatCard
              icon="pin"
              value={formatNumber(
                summary.steps.length
              )}
              label="étapes"
              detail={
                summary.importantCount +
                ' importante' +
                (
                  summary.importantCount > 1
                    ? 's'
                    : ''
                )
              }
            />

            <StatCard
              icon="map"
              value={formatNumber(
                summary.locations.length
              )}
              label="lieux"
              detail="départs, arrivées et visites"
            />

            <StatCard
              icon="route"
              value={formatNumber(
                summary.transports.length
              )}
              label="trajets"
              detail={
                summary.transportBreakdown
                  .length +
                ' mode' +
                (
                  summary.transportBreakdown
                    .length > 1
                    ? 's'
                    : ''
                )
              }
            />

            <StatCard
              icon="users"
              value={formatMoney(
                summary.totalBudget
              )}
              label="budget saisi"
              detail={
                summary.participants.length
                  ? formatMoney(
                      summary.totalBudget /
                      summary.participants
                        .length
                    ) +
                    ' par voyageur'
                  : 'Aucun voyageur renseigné'
              }
            />
          </section>

          <div className="trip-summary-grid">
            <Breakdown
              title="Modes de transport"
              subtitle="Nombre de trajets planifiés"
              items={
                summary.transportBreakdown
              }
              emptyText="Ajoute des transports à l’itinéraire pour obtenir ces statistiques."
            />

            <Breakdown
              title="Répartition des étapes"
              subtitle="Tout ce qui compose le voyage"
              items={
                summary.stepBreakdown
              }
              emptyText="Les catégories apparaîtront lorsque l’itinéraire contiendra des étapes."
            />

            <Breakdown
              title="Budget par catégorie"
              subtitle="Répartition des dépenses enregistrées"
              items={
                summary.budgetBreakdown
              }
              formatter={formatMoney}
              emptyText="Ajoute des dépenses dans le budget pour afficher leur répartition."
            />

            <section className="trip-summary-panel">
              <header className="trip-summary-panel-heading">
                <div>
                  <h2>Hébergements</h2>
                  <p>
                    Les nuits du voyage
                  </p>
                </div>
              </header>

              {summary.lodgingBreakdown
                .length === 0 ? (
                <div className="trip-summary-empty">
                  Aucun hébergement renseigné.
                </div>
              ) : (
                <div className="trip-summary-lodgings">
                  {summary.lodgingBreakdown
                    .map(
                      function renderLodging(
                        lodging
                      ) {
                        return (
                          <div
                            key={
                              lodging.name
                            }
                          >
                            <span className="trip-summary-lodging-icon">
                              <Icon
                                name="bed"
                                size={17}
                              />
                            </span>

                            <span>
                              <strong>
                                {lodging.name}
                              </strong>

                              <small>
                                {lodging.nights}{' '}
                                nuit
                                {lodging.nights >
                                1
                                  ? 's'
                                  : ''}
                              </small>
                            </span>
                          </div>
                        );
                      }
                    )}
                </div>
              )}
            </section>
          </div>

          <section className="trip-summary-memories">
            <div>
              <Icon
                name="file"
                size={20}
              />

              <span>
                <strong>
                  {summary.notesCount}
                </strong>
                notes de voyage
              </span>
            </div>

            <div>
              <Icon
                name="badge"
                size={20}
              />

              <span>
                <strong>
                  {summary.reservationCount}
                </strong>
                réservations référencées
              </span>
            </div>

            <div>
              <Icon
                name="users"
                size={20}
              />

              <span>
                <strong>
                  {summary.participants.length}
                </strong>
                voyageur
                {summary.participants.length >
                1
                  ? 's'
                  : ''}
              </span>
            </div>
          </section>
        </div>
      </div>
    );
  }

  function injectCss() {
    if (
      document.getElementById(
        'trip-summary-css'
      )
    ) {
      return;
    }

    const style =
      document.createElement('style');

    style.id = 'trip-summary-css';

    style.textContent = `
      .trip-summary-view {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        overflow: auto;
        background:
          radial-gradient(
            circle at 8% 0,
            var(--accent-soft),
            transparent 34%
          ),
          var(--bg);
      }

      .trip-summary-content {
        width: min(1180px, 100%);
        margin: 0 auto;
        padding: 30px;
      }

      .trip-summary-hero {
        position: relative;
        min-height: 270px;
        display: flex;
        align-items: flex-end;
        overflow: hidden;
        border: 1px solid var(--outline-variant);
        border-radius: 28px;
        background:
          linear-gradient(
            135deg,
            var(--accent),
            var(--accent-soft)
          );
        box-shadow: var(--shadow-lg);
      }

      .trip-summary-cover,
      .trip-summary-hero-overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .trip-summary-cover {
        object-fit: cover;
      }

      .trip-summary-hero-overlay {
        background:
          linear-gradient(
            90deg,
            rgba(15, 28, 25, .88),
            rgba(15, 28, 25, .40)
          );
      }

      .trip-summary-hero:not(.has-cover)
      .trip-summary-hero-overlay {
        background:
          linear-gradient(
            135deg,
            var(--accent),
            rgba(21, 48, 42, .76)
          );
      }

      .trip-summary-hero-content {
        position: relative;
        z-index: 1;
        width: 100%;
        padding: 34px;
        color: #fff;
      }

      .trip-summary-kicker,
      .trip-summary-status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .trip-summary-kicker {
        margin-bottom: 14px;
        color: rgba(255, 255, 255, .84);
      }

      .trip-summary-hero h1 {
        max-width: 720px;
        margin: 0;
        font-family: var(--font-serif);
        font-size: clamp(38px, 6vw, 68px);
        font-weight: 400;
        line-height: .98;
      }

      .trip-summary-hero p {
        margin: 13px 0 20px;
        color: rgba(255, 255, 255, .82);
        font-size: 14px;
        font-weight: 700;
        text-transform: capitalize;
      }

      .trip-summary-status {
        padding: 8px 11px;
        background: rgba(255, 255, 255, .16);
        color: #fff;
        backdrop-filter: blur(12px);
      }

      .trip-summary-progress {
        margin: 22px 0;
        padding: 17px 19px;
        border: 1px solid var(--outline-variant);
        border-radius: 17px;
        background: var(--card);
        box-shadow: var(--shadow-sm);
      }

      .trip-summary-progress > div:first-child {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 10px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 850;
      }

      .trip-summary-progress strong {
        color: var(--accent);
      }

      .trip-summary-progress-track,
      .trip-summary-bar-track {
        overflow: hidden;
        border-radius: 999px;
        background: var(--inset);
      }

      .trip-summary-progress-track {
        height: 8px;
      }

      .trip-summary-progress-track span,
      .trip-summary-bar-track span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background:
          linear-gradient(
            90deg,
            var(--accent),
            color-mix(
              in srgb,
              var(--accent) 65%,
              #fff
            )
          );
      }

      .trip-summary-stats {
        display: grid;
        grid-template-columns:
          repeat(6, minmax(0, 1fr));
        gap: 12px;
      }

      .trip-summary-stat {
        min-width: 0;
        padding: 18px;
        border: 1px solid var(--outline-variant);
        border-radius: 18px;
        background: var(--card);
        box-shadow: var(--shadow-sm);
      }

      .trip-summary-stat-icon {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        margin-bottom: 17px;
        border-radius: 13px;
        background: var(--accent-soft);
        color: var(--accent);
      }

      .trip-summary-stat > strong {
        display: block;
        overflow-wrap: anywhere;
        color: var(--text);
        font-family: var(--font-serif);
        font-size: 27px;
        font-weight: 400;
        line-height: 1;
      }

      .trip-summary-stat > span:not(
        .trip-summary-stat-icon
      ) {
        display: block;
        margin-top: 6px;
        color: var(--text);
        font-size: 12px;
        font-weight: 900;
      }

      .trip-summary-stat small {
        display: block;
        margin-top: 8px;
        color: var(--muted);
        font-size: 10.5px;
        font-weight: 700;
        line-height: 1.4;
      }

      .trip-summary-grid {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin-top: 22px;
      }

      .trip-summary-panel {
        min-width: 0;
        padding: 22px;
        border: 1px solid var(--outline-variant);
        border-radius: 21px;
        background: var(--card);
        box-shadow: var(--shadow-sm);
      }

      .trip-summary-panel-heading h2 {
        margin: 0;
        color: var(--text);
        font-family: var(--font-serif);
        font-size: 24px;
        font-weight: 400;
      }

      .trip-summary-panel-heading p {
        margin: 5px 0 0;
        color: var(--muted);
        font-size: 11.5px;
        font-weight: 700;
      }

      .trip-summary-bars,
      .trip-summary-lodgings {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-top: 21px;
      }

      .trip-summary-bar-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 7px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
      }

      .trip-summary-bar-label > span {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .trip-summary-bar-label strong {
        flex-shrink: 0;
        color: var(--text);
      }

      .trip-summary-bar-track {
        height: 7px;
      }

      .trip-summary-lodgings > div {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 11px;
        border-radius: 14px;
        background: var(--inset);
      }

      .trip-summary-lodging-icon {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        border-radius: 12px;
        background: var(--accent-soft);
        color: var(--accent);
      }

      .trip-summary-lodgings strong,
      .trip-summary-lodgings small {
        display: block;
      }

      .trip-summary-lodgings strong {
        color: var(--text);
        font-size: 12px;
      }

      .trip-summary-lodgings small {
        margin-top: 3px;
        color: var(--muted);
        font-size: 10.5px;
      }

      .trip-summary-empty {
        margin-top: 20px;
        padding: 17px;
        border-radius: 14px;
        background: var(--inset);
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        line-height: 1.5;
        text-align: center;
      }

      .trip-summary-memories {
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 16px;
      }

      .trip-summary-memories > div {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        padding: 16px 18px;
        border: 1px solid var(--outline-variant);
        border-radius: 16px;
        background: var(--card);
        color: var(--accent);
      }

      .trip-summary-memories span {
        color: var(--muted);
        font-size: 11.5px;
        font-weight: 750;
      }

      .trip-summary-memories strong {
        display: block;
        margin-bottom: 2px;
        color: var(--text);
        font-family: var(--font-serif);
        font-size: 22px;
        font-weight: 400;
      }

      @media (max-width: 1100px) {
        .trip-summary-stats {
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 700px) {
        .trip-summary-content {
          padding: 14px 12px 92px;
        }

        .trip-summary-hero {
          min-height: 240px;
          border-radius: 21px;
        }

        .trip-summary-hero-content {
          padding: 24px 20px;
        }

        .trip-summary-hero h1 {
          font-size: clamp(
            35px,
            12vw,
            52px
          );
        }

        .trip-summary-stats {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .trip-summary-stat {
          padding: 15px;
        }

        .trip-summary-grid,
        .trip-summary-memories {
          grid-template-columns: 1fr;
        }

        .trip-summary-panel {
          padding: 18px;
        }
      }

      @media (max-width: 360px) {
        .trip-summary-content {
          padding-right: 9px;
          padding-left: 9px;
        }

        .trip-summary-stat {
          padding: 13px;
        }

        .trip-summary-stat > strong {
          font-size: 23px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .trip-summary-view * {
          scroll-behavior: auto !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  injectCss();

  window.TripSummaryView =
    TripSummaryView;
})();