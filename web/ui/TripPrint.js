(function initTripPrint() {
  const TYPE_LABELS = {
    activite: 'Activité',
    restaurant: 'Restaurant',
    logement: 'Hébergement',
    transport: 'Transport',
    vol: 'Vol',
    train: 'Train',
    autre: 'Étape'
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    if (!value) return '';

    const date =
      new Date(
        String(value) + 'T12:00:00'
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    ).format(date);
  }

  function safeUrl(value) {
    const url =
      String(value || '').trim();

    return /^https?:\/\//i.test(url)
      ? url
      : '';
  }

  function renderDetail(label, value) {
    const cleanValue =
      String(value || '').trim();

    if (!cleanValue) return '';

    return (
      '<span class="step-detail">' +
        '<strong>' +
          escapeHtml(label) +
        '</strong> ' +
        escapeHtml(cleanValue) +
      '</span>'
    );
  }

  function renderStep(step) {
    const type =
      TYPE_LABELS[step.type] ||
      TYPE_LABELS.autre;

    const title =
      step.label ||
      step.lieu ||
      type;

    const time = [
      step.time,
      step.timeEnd
    ]
      .filter(Boolean)
      .join(' – ');

    const route = (
      step.depart ||
      step.arrivee
    )
      ? [
          step.depart,
          step.arrivee
        ]
          .filter(Boolean)
          .join(' → ')
      : step.lieu || '';

    const details = [
      renderDetail(
        'Lieu :',
        route
      ),
      renderDetail(
        'Transport :',
        step.transportType
      ),
      renderDetail(
        'Durée :',
        step.duree ||
          step.dureeEstimee
      ),
      renderDetail(
        'Réservation :',
        step.ref
      )
    ]
      .filter(Boolean)
      .join('');

    const link =
      safeUrl(step.link);

    return `
      <article class="step">
        <div class="step-time">
          ${escapeHtml(time || '—')}
        </div>

        <div class="step-content">
          <div class="step-heading">
            <span class="step-type">
              ${escapeHtml(type)}
            </span>

            ${
              step.important
                ? '<span class="important">Important</span>'
                : ''
            }
          </div>

          <h3>
            ${escapeHtml(title)}
          </h3>

          ${
            details
              ? `<div class="step-details">${details}</div>`
              : ''
          }

          ${
            step.note
              ? `<p class="step-note">${escapeHtml(step.note)}</p>`
              : ''
          }

          ${
            link
              ? `
                <a
                  class="step-link"
                  href="${escapeHtml(link)}"
                  target="_blank"
                  rel="noreferrer"
                >
                  Ouvrir le lien utile
                </a>
              `
              : ''
          }
        </div>
      </article>
    `;
  }

  function renderChecklist(items) {
    if (
      !Array.isArray(items) ||
      !items.length
    ) {
      return '';
    }

    return `
      <section class="checklist">
        <h3>À ne pas oublier</h3>

        <ul>
          ${items
            .map(
              item =>
                `<li>${escapeHtml(item)}</li>`
            )
            .join('')}
        </ul>
      </section>
    `;
  }

  function renderDay(day, index) {
    const steps = (
      Array.isArray(day.steps)
        ? day.steps
        : []
    )
      .slice()
      .sort(
        (first, second) =>
          Number(
            first.stepIndex || 0
          ) -
          Number(
            second.stepIndex || 0
          )
      );

    const title =
      day.title ||
      'Journée ' + (index + 1);

    const date =
      formatDate(day.dateISO) ||
      day.dateLabel ||
      '';

    return `
      <section class="day">
        <header class="day-header">
          <div class="day-number">
            Jour ${index + 1}
          </div>

          <div>
            <h2>
              ${escapeHtml(title)}
            </h2>

            ${
              date
                ? `<p>${escapeHtml(date)}</p>`
                : ''
            }
          </div>
        </header>

        ${
          day.note
            ? `<p class="day-note">${escapeHtml(day.note)}</p>`
            : ''
        }

        <div class="steps">
          ${
            steps.length
              ? steps
                  .map(renderStep)
                  .join('')
              : `
                <p class="empty">
                  Aucune étape prévue pour cette journée.
                </p>
              `
          }
        </div>

        ${renderChecklist(day.todo)}
      </section>
    `;
  }

  function buildDocument(trip) {
    const days =
      Array.isArray(trip.days)
        ? trip.days
        : [];

    const dateRange = [
      formatDate(trip.startDate),
      formatDate(trip.endDate)
    ]
      .filter(Boolean)
      .join(' → ');

    const generatedAt =
      new Intl.DateTimeFormat(
        'fr-FR',
        {
          dateStyle: 'long',
          timeStyle: 'short'
        }
      ).format(new Date());

    const content = days.length
      ? days
          .map(renderDay)
          .join('')
      : `
          <p class="empty">
            Ce voyage ne contient encore aucune journée.
          </p>
        `;

    return `
      <!doctype html>

      <html lang="fr">
        <head>
          <meta charset="utf-8">

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          >

          <link
            rel="preconnect"
            href="https://fonts.googleapis.com"
          >

          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossorigin
          >

          <link
            href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..700&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;700&display=swap"
            rel="stylesheet"
          >

          <title>
            ${escapeHtml(trip.name || 'Mon voyage')}
          </title>

          <style>
            :root {
              color-scheme: light;
              --ink: #203832;
              --muted: #6f746f;
              --line: #ded8cd;
              --paper: #fffdf9;
              --accent: #96640d;
              --soft: #f5f0e7;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body {
              margin: 0;
              color: var(--ink);
              background: #ebe7df;
              font-family:
                "DM Sans",
                Arial,
                sans-serif;
              line-height: 1.5;
            }

            .toolbar {
              position: sticky;
              top: 0;
              z-index: 10;
              display: flex;
              justify-content: center;
              padding: 12px;
              background: rgba(
                32,
                56,
                50,
                0.96
              );
            }

            .toolbar button {
              min-height: 44px;
              padding: 0 20px;
              border: 0;
              border-radius: 999px;
              color: white;
              background: var(--accent);
              font: inherit;
              font-weight: 800;
              cursor: pointer;
            }

            .sheet {
              width: min(
                100% - 24px,
                210mm
              );
              min-height: 297mm;
              margin: 24px auto;
              padding: 14mm 13mm 15mm;
              background: var(--paper);
              box-shadow:
                0 16px 60px
                rgba(32, 56, 50, 0.14);
            }

            .trip-header {
              padding-bottom: 18px;
              border-bottom:
                2px solid var(--ink);
            }

            .brand {
              margin-bottom: 12px;
              color: var(--accent);
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 0.16em;
              text-transform: uppercase;
            }

            .trip-header h1 {
              margin: 0;
              font-family:
                "DM Serif Display",
                Georgia,
                serif;
              font-size: 34px;
              line-height: 1.12;
            }

            .trip-dates {
              margin: 9px 0 0;
              color: var(--muted);
            }

            .global-note,
            .day-note {
              white-space: pre-wrap;
            }

            .global-note {
              margin: 18px 0 0;
              padding: 14px;
              border-left:
                4px solid var(--accent);
              background: var(--soft);
            }

            .day {
              padding-top: 24px;
            }

            .day + .day {
              break-before: page;
            }

            .day-header {
              display: grid;
              grid-template-columns:
                54px minmax(0, 1fr);
              gap: 14px;
              align-items: center;
              margin-bottom: 16px;
            }

            .day-number {
              display: grid;
              place-items: center;
              width: 54px;
              height: 54px;
              border-radius: 16px;
              color: white;
              background: var(--ink);
              font-size: 12px;
              font-weight: 900;
              text-align: center;
            }

            .day-header h2 {
              margin: 0;
              font-family:
                "DM Serif Display",
                Georgia,
                serif;
              font-size: 25px;
            }

            .day-header p {
              margin: 3px 0 0;
              color: var(--muted);
              font-size: 13px;
              text-transform: capitalize;
            }

            .day-note {
              margin: 0 0 16px;
              padding: 11px 13px;
              border-radius: 10px;
              background: var(--soft);
            }

            .steps {
              display: grid;
              gap: 10px;
            }

            .step {
              display: grid;
              grid-template-columns:
                72px minmax(0, 1fr);
              gap: 14px;
              padding: 14px 0;
              border-bottom:
                1px solid var(--line);
              break-inside: avoid;
            }

            .step-time {
              color: var(--accent);
              font-size: 12px;
              font-weight: 900;
            }

            .step-heading {
              display: flex;
              flex-wrap: wrap;
              gap: 7px;
              align-items: center;
            }

            .step-type,
            .important {
              font-size: 9px;
              font-weight: 900;
              letter-spacing: 0.1em;
              text-transform: uppercase;
            }

            .step-type {
              color: var(--muted);
            }

            .important {
              padding: 2px 6px;
              border-radius: 999px;
              color: #9a3f2b;
              background: #fae7e1;
            }

            .step h3 {
              margin: 4px 0 7px;
              font-size: 16px;
            }

            .step-details {
              display: flex;
              flex-wrap: wrap;
              gap: 5px 14px;
              color: var(--muted);
              font-size: 11px;
            }

            .step-note {
              margin: 8px 0 0;
              color: #4f5652;
              font-size: 12px;
              white-space: pre-wrap;
            }

            .step-link {
              display: inline-block;
              margin-top: 8px;
              color: var(--accent);
              font-size: 11px;
              font-weight: 800;
            }

            .checklist {
              margin-top: 18px;
              padding: 14px;
              border-radius: 12px;
              background: var(--soft);
              break-inside: avoid;
            }

            .checklist h3 {
              margin: 0 0 8px;
              font-size: 13px;
            }

            .checklist ul {
              margin: 0;
              padding-left: 20px;
            }

            .checklist li {
              margin: 3px 0;
              font-size: 12px;
            }

            .empty {
              padding: 20px;
              color: var(--muted);
              background: var(--soft);
              text-align: center;
            }

            .print-footer {
              margin-top: 28px;
              padding-top: 12px;
              border-top:
                1px solid var(--line);
              color: var(--muted);
              font-size: 10px;
              text-align: center;
            }

            @page {
              size: A4 portrait;
              margin: 14mm 13mm 15mm;
            }

            @media print {
              html,
              body {
                margin: 0;
                padding: 0;
                color: var(--ink) !important;
                background: var(--paper) !important;
              }

              body {
                font-family:
                  "DM Sans",
                  Arial,
                  sans-serif;
                font-size: 10.5pt;
                line-height: 1.45;
              }

              .toolbar {
                display: none !important;
              }

              .sheet {
                width: 100%;
                min-height: 0;
                margin: 0;
                padding: 0;
                background: var(--paper) !important;
                box-shadow: none;
              }

              .trip-header {
                break-after: avoid-page;
                page-break-after: avoid;
              }

              .day {
                padding-top: 9mm;
              }

              .day + .day {
                break-before: page;
                page-break-before: always;
              }

              .day-header,
              .day-note,
              .step,
              .checklist,
              .empty {
                break-inside: avoid-page;
                page-break-inside: avoid;
              }

              .step {
                grid-template-columns:
                  19mm minmax(0, 1fr);
              }

              h1,
              h2,
              h3 {
                break-after: avoid-page;
                page-break-after: avoid;
              }

              p,
              li {
                orphans: 3;
                widows: 3;
              }

              .day-number,
              .global-note,
              .day-note,
              .checklist,
              .empty,
              .important {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              a {
                color: var(--accent) !important;
                text-decoration: none;
              }

              .print-footer {
                break-inside: avoid-page;
                page-break-inside: avoid;
              }
            }

            @media (max-width: 600px) {
              .sheet {
                width: 100%;
                margin: 0;
                padding: 22px 16px;
                box-shadow: none;
              }

              .trip-header h1 {
                font-size: 29px;
              }

              .step {
                grid-template-columns:
                  58px minmax(0, 1fr);
                gap: 10px;
              }
            }
          </style>
        </head>

        <body>
          <div class="toolbar">
            <button
              type="button"
              onclick="printDocument(this)"
            >
              Imprimer / Enregistrer en PDF
            </button>
          </div>

          <main class="sheet">
            <header class="trip-header">
              <div class="brand">
                La Fabrique à Voyages
              </div>

              <h1>
                ${escapeHtml(trip.name || 'Mon voyage')}
              </h1>

              ${
                dateRange
                  ? `<p class="trip-dates">${escapeHtml(dateRange)}</p>`
                  : ''
              }

              ${
                trip.globalNote
                  ? `<p class="global-note">${escapeHtml(trip.globalNote)}</p>`
                  : ''
              }
            </header>

            ${content}

            <footer class="print-footer">
              Document généré le
              ${escapeHtml(generatedAt)}.
              Les documents privés ne sont pas inclus.
            </footer>
          </main>
          <script>
            async function printDocument(button) {
              const originalText =
                button.textContent;

              button.disabled = true;
              button.textContent =
                'Préparation du PDF…';

              try {
                if (
                  document.fonts &&
                  document.fonts.ready
                ) {
                  await document.fonts.ready;
                }

                await new Promise(
                  function waitForLayout(resolve) {
                    requestAnimationFrame(
                      function firstFrame() {
                        requestAnimationFrame(
                          resolve
                        );
                      }
                    );
                  }
                );

                window.print();
              } finally {
                window.setTimeout(
                  function restoreButton() {
                    button.disabled = false;
                    button.textContent =
                      originalText;
                  },
                  300
                );
              }
            }
          </script>
        </body>
      </html>
    `;
  }

  function open(trip) {
    if (!trip) {
      window.Store?.showToast?.(
        'Aucun voyage à exporter.'
      );

      return false;
    }

    const preview =
      window.open(
        '',
        '_blank'
      );

    if (!preview) {
      window.Store?.showToast?.(
        'Autorise les fenêtres surgissantes pour ouvrir l’aperçu PDF.'
      );

      return false;
    }

    preview.opener = null;
    preview.document.open();
    preview.document.write(
      buildDocument(trip)
    );
    preview.document.close();
    preview.focus();

    return true;
  }

  window.TripPrint = {
    open
  };
})();