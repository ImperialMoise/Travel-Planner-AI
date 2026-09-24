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

    const dailyBreakdown =
      days
        .map(function createDailyItem(
          day,
          index
        ) {
          return {
            id:
              day?.id ||
              day?.dateISO ||
              String(index),
            label:
              'Jour ' + (index + 1),
            value:
              safeArray(day?.steps).length,
            icon: 'cal'
          };
        })
        .filter(
          item => item.value > 0
        );

    const freeDays =
      Math.max(
        0,
        dayCount - plannedDays
      );

    const averageStepsPerPlannedDay =
      plannedDays
        ? steps.length / plannedDays
        : 0;

    const busiestDay =
      dailyBreakdown.reduce(
        function selectBusiest(
          current,
          item
        ) {
          if (
            !current ||
            item.value > current.value
          ) {
            return item;
          }

          return current;
        },
        null
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
      dayCount,
      dailyBreakdown,
      freeDays,
      averageStepsPerPlannedDay,
      busiestDay
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
    const trip = Store.useStore(state => state.trip);
    const summary = React.useMemo(() => createSummary(trip), [trip]);
    if (!trip) return null;
    const dateRange = [formatDate(summary.startDate), formatDate(summary.endDate)].filter(Boolean).join(' — ');
    const secondary = [
      ['Lieux', summary.locations.length, 'Départs, arrivées et visites'],
      ['Trajets', summary.transports.length, summary.transportBreakdown.length + ' modes de transport'],
      ['Notes', summary.notesCount, 'Dans le voyage et ses journées'],
      ['Réservations', summary.reservationCount, 'Références renseignées'],
      ['Activités', summary.stepBreakdown.find(item => item.id === 'activite')?.value || 0, 'Visites et découvertes'],
      ['Restaurants', summary.stepBreakdown.find(item => item.id === 'restaurant')?.value || 0, 'Repas planifiés'],
      ['Voyageurs', summary.participants.length, 'Dans le budget partagé']
    ];
    return (
      <div className="trip-summary-view fv-workpage">
        <div className="fv-workcontent">
          <header className="fv-workhead">
            <div><span className="fv-eyebrow">Vue d’ensemble</span><h1>Bilan du voyage</h1>
              <p>{trip.name}{dateRange ? ' · ' + dateRange : ''}</p></div>
            <span className="fv-status">{summary.statusLabel}</span>
          </header>
          <section className="fv-summary-progress">
            {trip.coverImageUrl && <img src={trip.coverImageUrl} alt="" onError={event => { event.currentTarget.hidden = true; }} />}
            <div><div className="fv-bar-label"><span>Progression dans le calendrier</span><strong>{summary.progress} %</strong></div>
              <div className="fv-bar-track" role="progressbar" aria-label="Progression du voyage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.progress}>
                <span style={{ width: summary.progress + '%' }} />
              </div><p className="fv-muted">Cette progression suit les dates, pas les activités effectuées.</p>
            </div>
          </section>
          <section className="trip-summary-stats" aria-label="Chiffres principaux">
            <StatCard icon="cal" value={formatNumber(summary.dayCount)} label="jours" detail={summary.plannedDays + ' organisés · ' + summary.freeDays + ' libres'} />
            <StatCard icon="pin" value={formatNumber(summary.steps.length)} label="étapes" detail={summary.importantCount + ' importantes'} />
            <StatCard icon="bed" value={formatNumber(summary.totalNights)} label="nuits" detail={summary.lodgingBreakdown.length + ' hébergements'} />
            <StatCard icon="users" value={formatMoney(summary.totalBudget)} label="budget saisi" detail={summary.participants.length
              ? formatMoney(summary.totalBudget / summary.participants.length) + ' par voyageur' : 'Aucun voyageur renseigné'} />
          </section>
          <div className="fv-summary-layout">
            <div className="fv-summary-main">
              <section className="fv-panel">
                <header className="fv-panel-head"><div><h2>Rythme du voyage</h2><p>Ce qui est prévu dans l’itinéraire.</p></div>
                  <button type="button" className="fv-control" onClick={() => Store.set({ view: 'itinerary' })}>Voir l’itinéraire</button></header>
                <dl className="fv-summary-rhythm">
                  <div><dt>Étapes par jour organisé</dt><dd>{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(summary.averageStepsPerPlannedDay)}</dd></div>
                  <div><dt>Journée la plus chargée</dt><dd>{summary.busiestDay?.label || 'Aucune'}</dd></div>
                  <div><dt>Budget moyen par jour</dt><dd>{formatMoney(summary.dayCount ? summary.totalBudget / summary.dayCount : 0)}</dd></div>
                </dl>
              </section>
              <div className="trip-summary-grid">
                <Breakdown title="Répartition des journées" subtitle="Nombre d’étapes prévues par jour" items={summary.dailyBreakdown} emptyText="Ajoute des étapes pour visualiser le rythme du voyage." />
                <Breakdown title="Modes de transport" subtitle="Nombre de trajets planifiés" items={summary.transportBreakdown} emptyText="Aucun transport renseigné." />
                <Breakdown title="Répartition des étapes" subtitle="Les catégories du programme" items={summary.stepBreakdown} emptyText="Aucune étape renseignée." />
                <Breakdown title="Budget par catégorie" subtitle="Dépenses enregistrées" items={summary.budgetBreakdown} formatter={formatMoney} emptyText="Aucune dépense enregistrée." />
              </div>
            </div>
            <aside className="fv-summary-side">
              <section className="fv-panel">
                <header className="fv-panel-head"><h2>Hébergements</h2><Icon name="bed" size={20} /></header>
                {summary.lodgingBreakdown.length ? <ul className="fv-summary-lodgings">
                  {summary.lodgingBreakdown.map(lodging => <li key={lodging.name}><strong>{lodging.name}</strong><small>{lodging.nights} nuit{lodging.nights > 1 ? 's' : ''}</small></li>)}
                </ul> : <p className="fv-empty-note">Aucun hébergement renseigné.</p>}
              </section>
              <section className="fv-panel"><header className="fv-panel-head"><h2>En détail</h2></header>
                <dl className="fv-summary-details">{secondary.map(([label,value,detail]) => <div key={label}><dt>{label}<small>{detail}</small></dt><dd>{formatNumber(value)}</dd></div>)}</dl>
              </section>
              <button type="button" className="fv-control" onClick={() => Store.set({ view: 'budget' })}>Ouvrir le budget</button>
            </aside>
          </div>
          {summary.statusLabel === 'Voyage terminé' && <section className="fv-panel fv-section-space">
            <h2>Le voyage est terminé</h2><p className="fv-muted">Ton carnet conserve {summary.days.length} journées, {summary.totalNights} nuits, {summary.transports.length} trajets et {summary.locations.length} lieux renseignés.</p>
          </section>}
        </div>
      </div>
    );
  }

  window.TripSummaryView =
    TripSummaryView;
})();
