(function initTripDraftParser() {
  const MONTHS = {
    janvier: 1,
    fevrier: 2,
    mars: 3,
    avril: 4,
    mai: 5,
    juin: 6,
    juillet: 7,
    aout: 8,
    septembre: 9,
    octobre: 10,
    novembre: 11,
    decembre: 12
  };

  const NUMBER_WORDS = {
    une: 1,
    un: 1,
    deux: 2,
    trois: 3,
    quatre: 4,
    cinq: 5,
    six: 6,
    sept: 7,
    huit: 8,
    neuf: 9,
    dix: 10,
    onze: 11,
    douze: 12,
    treize: 13,
    quatorze: 14,
    quinze: 15,
    seize: 16,
    'dix-sept': 17,
    'dix-huit': 18,
    'dix-neuf': 19,
    vingt: 20
  };

  const NUMBER_PATTERN =
    '(?:\\d+|' +
    Object.keys(NUMBER_WORDS)
      .sort(function sortNumberWords(first, second) {
        return second.length - first.length;
      })
      .join('|') +
    ')';

  const EXAMPLE = [
    'Voyage : Corée du Sud',
    'Dates : 01/10/2026 au 12/10/2026',
    'Séjour : 01/10/2026 au 06/10/2026 | Séoul | Hôtel à Séoul',
    'Transport : 06/10/2026 | Séoul > Gyeongju | Train | 2 h',
    'Séjour : 06/10/2026 au 09/10/2026 | Gyeongju | Hanok',
    'Étape : 07/10/2026 | Temple Bulguksa | Gyeongju | 10:00',
    'Séjour : 09/10/2026 au 12/10/2026 | Busan | Hôtel à Busan',
    'Étape : 10/10/2026 | Village culturel de Gamcheon | Busan | 09:30'
  ].join('\n');

  const NATURAL_EXAMPLE = [
    'Je pars en Corée du Sud du 1 au 12 octobre 2026, cinq nuits à Séoul, trois nuits à Gyeongju, puis trois nuits à Busan.',
    'Le 6 octobre 2026, train de Séoul à Gyeongju à 08:30.',
    'Le 7 octobre 2026, visite du temple Bulguksa à Gyeongju à 10:00.',
    'Le 10 octobre 2026, dîner chez Jagalchi à Busan à 19:30.'
  ].join('\n');

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function validISO(year, month, day) {
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      12
    );

    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day)
    ) {
      return '';
    }

    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join('-');
  }

  function parseDate(value, fallbackYear) {
    const raw = String(value || '')
      .trim()
      .replace(/[.,;]+$/g, '');

    let match = raw.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

    if (match) {
      return validISO(
        match[1],
        match[2],
        match[3]
      );
    }

    match = raw.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

    if (match) {
      return validISO(
        match[3],
        match[2],
        match[1]
      );
    }

    match = normalize(raw).match(
      /^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/
    );

    if (match && MONTHS[match[2]]) {
      const year =
        match[3] ||
        fallbackYear ||
        new Date().getFullYear();

      return validISO(
        year,
        MONTHS[match[2]],
        match[1]
      );
    }

    return '';
  }

  function parseRange(value, fallbackYear) {
    const parts = String(value || '')
      .split(
        /\s+(?:au|jusqu['’]au|→)\s+/i
      )
      .map(part => part.trim())
      .filter(Boolean);

    if (parts.length !== 2) {
      return null;
    }

    const start = parseDate(
      parts[0],
      fallbackYear
    );

    const end = parseDate(
      parts[1],
      start
        ? Number(start.slice(0, 4))
        : fallbackYear
    );

    if (!start || !end || end < start) {
      return null;
    }

    return {
      start,
      end
    };
  }

  function addDaysISO(iso, difference) {
    const date = new Date(
      String(iso) + 'T12:00:00'
    );

    date.setDate(
      date.getDate() +
      Number(difference || 0)
    );

    return date.toISOString().slice(0, 10);
  }

  function diffDays(startISO, endISO) {
    const start = new Date(
      String(startISO) + 'T12:00:00'
    );

    const end = new Date(
      String(endISO) + 'T12:00:00'
    );

    return Math.max(
      0,
      Math.round(
        (end - start) / 86400000
      )
    );
  }

  function parseNumber(value) {
    const normalized = normalize(value);

    if (/^\d+$/.test(normalized)) {
      return Number(normalized);
    }

    return NUMBER_WORDS[normalized] || 0;
  }

    function normalizeClockTime(value) {
    const match =
      String(value || '')
        .trim()
        .match(
          /^(\d{1,2})(?::(\d{2})|h(\d{0,2}))$/i
        );

    if (!match) return '';

    const hour =
      Number(match[1]);

    const minute =
      Number(
        match[2] ||
        match[3] ||
        0
      );

    if (
      hour > 23 ||
      minute > 59
    ) {
      return '';
    }

    return (
      pad(hour) +
      ':' +
      pad(minute)
    );
  }


  function transportType(value) {
    const key = normalize(value);

    if (/avion|vol/.test(key)) return 'avion';
    if (/bus|car/.test(key)) return 'bus';
    if (/voiture|auto/.test(key)) return 'voiture';
    if (/ferry|bateau/.test(key)) return 'ferry';
    if (/metro/.test(key)) return 'metro';
    if (/pied|marche/.test(key)) return 'pied';
    if (/taxi/.test(key)) return 'taxi';

    return 'train';
  }

  function addStay(
    plan,
    range,
    location,
    label
  ) {
    const cleanLocation =
      String(location || '').trim();

    if (!range || !cleanLocation) {
      return;
    }

    const nights = diffDays(
      range.start,
      range.end
    );

    plan.items.push({
      date: range.start,
      type: 'logement',
      label:
        String(label || '').trim() ||
        'Séjour à ' + cleanLocation,
      lieu: cleanLocation,
      dateStart: range.start,
      dateEnd: range.end,
      nuits: nights,
      timeCheckIn: '15:00',
      timeCheckOut: '11:00'
    });

    for (
      let date = range.start;
      date < range.end;
      date = addDaysISO(date, 1)
    ) {
      if (!plan.dayTitles[date]) {
        plan.dayTitles[date] =
          cleanLocation;
      }
    }
  }

    function parseNaturalItems(
    text,
    plan,
    fallbackYear
  ) {
    let recognizedItems = 0;

    const sentences =
      String(text || '')
        .split(/\r?\n|[.!?]\s+/)
        .map(function cleanSentence(
          sentence
        ) {
          return sentence
            .trim()
            .replace(/[.!?]+$/g, '');
        })
        .filter(Boolean);

    sentences.forEach(
      function readNaturalItem(
        sentence
      ) {
        const dateMatch =
          sentence.match(
            /^(?:le\s+)?(\d{1,2}\s+[a-zA-ZÀ-ÿ-]+(?:\s+\d{4})?)\s*[,;:-]\s*(.+)$/i
          );

        if (!dateMatch) return;

        const date =
          parseDate(
            dateMatch[1],
            fallbackYear
          );

        if (!date) return;

        if (
          plan.startDate &&
          plan.endDate &&
          (
            date < plan.startDate ||
            date > plan.endDate
          )
        ) {
          plan.warnings.push(
            'Élément ignoré le ' +
            dateMatch[1] +
            ' : cette date est hors du voyage.'
          );
          return;
        }

        let content =
          dateMatch[2].trim();

        const timeMatch =
          content.match(
            /\s+(?:a|à)\s+(\d{1,2}(?::\d{2}|h\d{0,2}))$/i
          );

        const time =
          timeMatch
            ? normalizeClockTime(
                timeMatch[1]
              )
            : '';

        if (timeMatch) {
          content =
            content
              .slice(
                0,
                timeMatch.index
              )
              .trim();
        }

        const transportMatch =
          content.match(
            /^(?:prendre\s+)?(?:le\s+|un\s+)?(train|avion|vol|bus|car|voiture|taxi|ferry|bateau|metro|métro)\s+(?:de|depuis)\s+(.+?)\s+(?:a|à|vers|jusqu['’]a|jusqu['’]à)\s+(.+)$/i
          );

        if (transportMatch) {
          plan.items.push({
            date,
            type: 'transport',
            label: '',
            depart:
              transportMatch[2].trim(),
            arrivee:
              transportMatch[3].trim(),
            transportType:
              transportType(
                transportMatch[1]
              ),
            duree: '',
            time
          });

          recognizedItems += 1;
          return;
        }

        const activityMatch =
          content.match(
            /^(?:visite|visiter|activite|activité|decouverte|découverte)\s+(.+)$/i
          );

        if (activityMatch) {
          let activityLabel =
            activityMatch[1]
              .trim()
              .replace(
                /^(?:de |du |de la |des |la |le |l['’])/i,
                ''
              );

          let activityLocation = '';

          const locationMatch =
            activityLabel.match(
              /^(.+)\s+(?:a|à|au|aux)\s+([^,]+)$/i
            );

          if (locationMatch) {
            activityLabel =
              locationMatch[1].trim();

            activityLocation =
              locationMatch[2].trim();
          }

          plan.items.push({
            date,
            type: 'activite',
            label: activityLabel,
            lieu: activityLocation,
            time
          });

          recognizedItems += 1;
          return;
        }

        const restaurantMatch =
          content.match(
            /^(?:diner|dîner|dejeuner|déjeuner|restaurant|repas)\s+(?:chez|au restaurant|a|à)\s+(.+)$/i
          );

        if (restaurantMatch) {
          let restaurantLabel =
            restaurantMatch[1].trim();

          let restaurantLocation = '';

          const locationMatch =
            restaurantLabel.match(
              /^(.+)\s+(?:a|à|au|aux)\s+([^,]+)$/i
            );

          if (locationMatch) {
            restaurantLabel =
              locationMatch[1].trim();

            restaurantLocation =
              locationMatch[2].trim();
          }

          plan.items.push({
            date,
            type: 'restaurant',
            label: restaurantLabel,
            lieu: restaurantLocation,
            time
          });

          recognizedItems += 1;
        }
      }
    );

    return recognizedItems;
  }


  function parseNaturalSentence(
    text,
    plan
  ) {
    const naturalText =
      String(text || '').trim();

    const tripMatch =
      naturalText.match(
        /je pars\s+(?:en|a|à|au|aux)\s+(.+?)\s+du\s+(\d{1,2})\s+au\s+(\d{1,2})\s+([a-zA-ZÀ-ÿ-]+)(?:\s+(\d{4}))?/i
      );

    if (!tripMatch) {
      return 0;
    }

    const year =
      Number(tripMatch[5]) ||
      new Date().getFullYear();

     const month =
      MONTHS[
        normalize(tripMatch[4])
      ];

    if (!month) return 0;

    const destination =
      tripMatch[1].trim();

    plan.name =
      destination.charAt(0).toUpperCase() +
      destination.slice(1);

    plan.startDate = validISO(
      year,
      month,
      tripMatch[2]
    );

    plan.endDate = validISO(
      year,
      month,
      tripMatch[3]
    );

    if (!tripMatch[5]) {
      plan.warnings.push(
        'Année absente : ' +
        year +
        ' a été utilisée.'
      );
    }

    const stayPattern =
      new RegExp(
        '(?:les?\\s+)?(' +
          NUMBER_PATTERN +
        ')\\s+' +
        '(?:premieres?\\s+)?' +
        'nuits?\\s+' +
        '(?:a|à|au|aux)\\s+' +
        '([^,.;]+)',
        'gi'
      );

    const stayMatches = [
      ...naturalText.matchAll(
        stayPattern
      )
    ];

    let stayCursor =
      plan.startDate;

    stayMatches.forEach(
      function addNaturalStay(
        stayMatch
      ) {
        const nights =
          parseNumber(stayMatch[1]);

        const location =
          String(stayMatch[2] || '')
            .trim();

        if (
          !nights ||
          !location ||
          !stayCursor ||
          !plan.endDate ||
          stayCursor >= plan.endDate
        ) {
          return;
        }

        const requestedEnd =
          addDaysISO(
            stayCursor,
            nights
          );

        const stayEnd =
          requestedEnd > plan.endDate
            ? plan.endDate
            : requestedEnd;

        addStay(
          plan,
          {
            start: stayCursor,
            end: stayEnd
          },
          location,
          ''
        );

        stayCursor =
          stayEnd;
      }
    );

    const remainingStay =
      naturalText.match(
        /(?:ensuite|puis)\s+(?:a|à|au|aux)\s+([^,.;]+)/i
      );

    if (
      remainingStay &&
      stayCursor &&
      plan.endDate &&
      stayCursor < plan.endDate
    ) {
      addStay(
        plan,
        {
          start: stayCursor,
          end: plan.endDate
        },
        remainingStay[1],
        ''
      );

      stayCursor =
        plan.endDate;
    }

    if (
      stayMatches.length &&
      stayCursor &&
      plan.endDate &&
      stayCursor < plan.endDate &&
      !remainingStay
    ) {
      plan.warnings.push(
        'Certaines nuits restent sans hébergement. Tu pourras les compléter après la création.'
      );
    }

    return 1;
  }

  function parse(text) {
    const source =
      String(text || '').trim();

    const plan = {
      name: '',
      startDate: '',
      endDate: '',
      days: 1,
      items: [],
      dayTitles: {},
      warnings: [],
      errors: [],
      recognizedLines: 0
    };

    if (!source) {
      plan.errors.push(
        'Écris une description du voyage.'
      );

      return plan;
    }

    plan.recognizedLines +=
      parseNaturalSentence(
        source,
        plan
      );

    const lines = source
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    lines.forEach(function readHeader(line) {
      const match = line.match(
        /^([^:]+)\s*:\s*(.+)$/
      );

      if (!match) return;

      const key = normalize(match[1]);
      const value = match[2].trim();

      if (
        key === 'voyage' ||
        key === 'destination'
      ) {
        plan.name = value;
        plan.recognizedLines += 1;
      }

      if (key === 'dates') {
        const range = parseRange(
          value,
          new Date().getFullYear()
        );

        if (range) {
          plan.startDate = range.start;
          plan.endDate = range.end;
          plan.recognizedLines += 1;
        } else {
          plan.warnings.push(
            'La ligne « Dates » n’a pas été comprise.'
          );
        }
      }
    });

    const fallbackYear =
      plan.startDate
        ? Number(plan.startDate.slice(0, 4))
        : new Date().getFullYear();

    const hasStructuredStay =
      lines.some(line =>
        /^(sejour|hebergement)\s*:/i.test(
          normalize(line)
        )
      );

    if (hasStructuredStay) {
      plan.items = [];
      plan.dayTitles = {};
    }

    plan.recognizedLines +=
      parseNaturalItems(
        source,
        plan,
        fallbackYear
      );

    lines.forEach(function readItem(line) {
      const match = line.match(
        /^([^:]+)\s*:\s*(.+)$/
      );

      if (!match) return;

      const key = normalize(match[1]);
      const parts = match[2]
        .split('|')
        .map(part => part.trim());

      if (
        key === 'sejour' ||
        key === 'hebergement'
      ) {
        const range = parseRange(
          parts[0],
          fallbackYear
        );

        if (!range || !parts[1]) {
          plan.warnings.push(
            'Séjour ignoré : dates ou ville manquantes.'
          );
          return;
        }

        addStay(
          plan,
          range,
          parts[1],
          parts[2]
        );

        plan.recognizedLines += 1;
        return;
      }

      if (
        key === 'etape' ||
        key === 'activite'
      ) {
        const date = parseDate(
          parts[0],
          fallbackYear
        );

        if (!date || !parts[1]) {
          plan.warnings.push(
            'Étape ignorée : date ou titre manquant.'
          );
          return;
        }

        plan.items.push({
          date,
          type: 'activite',
          label: parts[1],
          lieu: parts[2] || '',
          time: parts[3] || ''
        });

        plan.recognizedLines += 1;
        return;
      }

      if (key === 'restaurant') {
        const date = parseDate(
          parts[0],
          fallbackYear
        );

        if (!date || !parts[1]) {
          plan.warnings.push(
            'Restaurant ignoré : date ou nom manquant.'
          );
          return;
        }

        plan.items.push({
          date,
          type: 'restaurant',
          label: parts[1],
          lieu: parts[2] || '',
          time: parts[3] || ''
        });

        plan.recognizedLines += 1;
        return;
      }

      if (key === 'transport') {
        const date = parseDate(
          parts[0],
          fallbackYear
        );

        const route = String(
          parts[1] || ''
        )
          .split(/\s*(?:->|→|>)\s*/)
          .map(value => value.trim());

        if (
          !date ||
          route.length !== 2
        ) {
          plan.warnings.push(
            'Transport ignoré : date ou trajet incorrect.'
          );
          return;
        }

        plan.items.push({
          date,
          type: 'transport',
          label: '',
          depart: route[0],
          arrivee: route[1],
          transportType:
            transportType(parts[2]),
          duree: parts[3] || '',
          time: parts[4] || ''
        });

        plan.recognizedLines += 1;
      }
    });

    if (
      plan.startDate &&
      plan.endDate
    ) {
      plan.days =
        diffDays(
          plan.startDate,
          plan.endDate
        ) + 1;
    }

    plan.items.sort(function sortItems(
      first,
      second
    ) {
      return String(first.date)
        .localeCompare(
          String(second.date)
        );
    });

    if (!plan.name) {
      plan.warnings.push(
        'Destination non détectée : complète le nom manuellement.'
      );
    }

    if (
      !plan.startDate ||
      !plan.endDate
    ) {
      plan.warnings.push(
        'Dates non détectées : complète-les manuellement.'
      );
    }

    if (!plan.items.length) {
      plan.warnings.push(
        'Aucun hébergement, transport ou activité détecté.'
      );
    }

    if (!plan.recognizedLines) {
      plan.errors.push(
        'Le texte n’a pas été compris. Utilise le modèle proposé.'
      );
    }

    return plan;
  }

  window.TripDraftParser = {
    parse,
    example: EXAMPLE,
    naturalExample: NATURAL_EXAMPLE
  };
})();