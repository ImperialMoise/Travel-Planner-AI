// ════════════════════════════════════════════════════════════
// CurrencyWidget.js — Widget “Convertisseur”
// ════════════════════════════════════════════════════════════
//
// Rôle :
// - Convertir un montant entre deux devises.
// - Récupérer un taux automatique via Frankfurter.
// - Garder un taux manuel possible.
// - Sauvegarder les derniers taux en localStorage.
// - Ne pas casser l’expérience si l’API externe est indisponible.
//
// Dépendances globales :
// - React
// - Icon
//
// API :
//   <window.CurrencyWidget
//     editMode={editMode}
//     onRemove={onRemove}
//   />
//
// ════════════════════════════════════════════════════════════

(function initCurrencyWidget() {
  const CURRENCY_OPTIONS = [
    { code: 'EUR', label: 'Euro' },
    { code: 'KRW', label: 'Won sud-coréen' },
    { code: 'USD', label: 'Dollar américain' },
    { code: 'JPY', label: 'Yen japonais' },
    { code: 'GBP', label: 'Livre sterling' },
    { code: 'CHF', label: 'Franc suisse' },
    { code: 'CAD', label: 'Dollar canadien' },
    { code: 'AUD', label: 'Dollar australien' },
    { code: 'CNY', label: 'Yuan chinois' },
    { code: 'THB', label: 'Baht thaïlandais' },
    { code: 'MAD', label: 'Dirham marocain' },
    { code: 'TRY', label: 'Livre turque' }
  ];

  const FALLBACK_RATES = {
    EUR_EUR: 1,
    EUR_KRW: 1600,
    KRW_EUR: 0.000625,
    EUR_USD: 1.08,
    USD_EUR: 0.93,
    EUR_JPY: 165,
    JPY_EUR: 0.0061,
    EUR_GBP: 0.86,
    GBP_EUR: 1.16,
    EUR_CHF: 0.95,
    CHF_EUR: 1.05,
    EUR_CAD: 1.47,
    CAD_EUR: 0.68,
    EUR_AUD: 1.64,
    AUD_EUR: 0.61,
    EUR_CNY: 7.8,
    CNY_EUR: 0.128,
    EUR_THB: 39,
    THB_EUR: 0.026,
    EUR_MAD: 10.8,
    MAD_EUR: 0.093,
    EUR_TRY: 35,
    TRY_EUR: 0.029
  };

  function safeNumber(value) {
    const normalized = String(value == null ? '' : value)
      .replace(/\s/g, '')
      .replace(',', '.');

    const number = Number(normalized);

    return Number.isFinite(number) ? number : 0;
  }

  function pairKey(from, to) {
    return String(from || 'EUR') + '_' + String(to || 'EUR');
  }

  function storageRateKey(from, to) {
    return 'atelier_currency_rate_' + pairKey(from, to);
  }

  function storageDateKey(from, to) {
    return 'atelier_currency_date_' + pairKey(from, to);
  }

  function fallbackRate(from, to) {
    if (from === to) return 1;

    const direct = FALLBACK_RATES[pairKey(from, to)];

    if (direct) return direct;

    const viaEurFrom = FALLBACK_RATES[pairKey(from, 'EUR')];
    const viaEurTo = FALLBACK_RATES[pairKey('EUR', to)];

    if (viaEurFrom && viaEurTo) {
      return viaEurFrom * viaEurTo;
    }

    return 1;
  }

  function readSavedRate(from, to) {
    const saved = safeNumber(localStorage.getItem(storageRateKey(from, to)));

    return saved || fallbackRate(from, to);
  }

  function readSavedDate(from, to) {
    return localStorage.getItem(storageDateKey(from, to)) || '';
  }

  function saveRateToStorage(from, to, rate, date) {
    localStorage.setItem(storageRateKey(from, to), String(rate || 0));
    localStorage.setItem(storageDateKey(from, to), date || 'manuel');
  }

  function formatMoney(value, code) {
    const number = Number(value) || 0;
    const noDecimals = code === 'KRW' || code === 'JPY';

    return number.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: noDecimals ? 0 : 2
    }) + ' ' + code;
  }

  function cardStyle() {
    return {
      background: 'var(--card)',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(82,98,91,0.05)',
      border: '1px solid var(--outline-variant)',
      overflow: 'hidden'
    };
  }

  function headerStyle() {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      padding: '12px 16px',
      borderBottom: '1px solid var(--outline-variant)',
      background: 'var(--soft)'
    };
  }

  function removeButtonStyle() {
    return {
      width: 22,
      height: 22,
      borderRadius: 7,
      border: 'none',
      cursor: 'pointer',
      background: 'var(--accent-soft)',
      color: 'var(--accent)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 15
    };
  }

  function inputStyle() {
    return {
      width: '100%',
      padding: '9px 10px',
      borderRadius: 9,
      border: '1px solid var(--outline-variant)',
      background: 'var(--inset)',
      color: 'var(--text)',
      fontFamily: 'inherit',
      fontSize: 13,
      outline: 'none'
    };
  }

  function selectStyle() {
    return {
      width: '100%',
      padding: '8px 9px',
      borderRadius: 9,
      border: '1px solid var(--outline-variant)',
      background: 'var(--inset)',
      color: 'var(--text)',
      fontFamily: 'inherit',
      fontSize: 12.5,
      outline: 'none'
    };
  }

  function fieldLabelStyle() {
    return {
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      color: 'var(--faint)',
      marginBottom: 5
    };
  }

  function Field({ label, children }) {
    return (
      <div>
        <div style={fieldLabelStyle()}>{label}</div>
        {children}
      </div>
    );
  }

  function CurrencyWidget({ editMode, onRemove }) {
    const [amount, setAmount] = React.useState('100');
    const [from, setFrom] = React.useState('EUR');
    const [to, setTo] = React.useState('KRW');

    const [rate, setRate] = React.useState(() => readSavedRate('EUR', 'KRW'));
    const [manualRate, setManualRate] = React.useState(() => String(readSavedRate('EUR', 'KRW')));
    const [rateDate, setRateDate] = React.useState(() => readSavedDate('EUR', 'KRW') || 'manuel');

    const [autoRate, setAutoRate] = React.useState(true);
    const [loading, setLoading] = React.useState(false);
    const [lastError, setLastError] = React.useState('');

    const amountNumber = safeNumber(amount);
    const rateNumber = safeNumber(manualRate) || rate || 0;
    const converted = amountNumber * rateNumber;

    React.useEffect(function updateRateWhenPairChanges() {
      if (from === to) {
        setRate(1);
        setManualRate('1');
        setRateDate('');
        setLastError('');
        return;
      }

      if (autoRate) {
        fetchRate(from, to);
        return;
      }

      const saved = readSavedRate(from, to);

      setRate(saved);
      setManualRate(String(saved));
      setRateDate(readSavedDate(from, to) || 'manuel');
      setLastError('');
    }, [from, to, autoRate]);

    async function fetchRate(source, target) {
      if (!source || !target) return;

      if (source === target) {
        setRate(1);
        setManualRate('1');
        setRateDate('');
        setLastError('');
        return;
      }

      setLoading(true);
      setLastError('');

      try {
        const url =
          'https://api.frankfurter.dev/v1/latest?from=' +
          encodeURIComponent(source) +
          '&to=' +
          encodeURIComponent(target);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Taux indisponible');
        }

        const data = await response.json();
        const nextRate = data && data.rates
          ? Number(data.rates[target])
          : 0;

        if (!nextRate) {
          throw new Error('Taux introuvable');
        }

        setRate(nextRate);
        setManualRate(String(nextRate));
        setRateDate(data.date || '');
        saveRateToStorage(source, target, nextRate, data.date || '');
      } catch (error) {
        const saved = readSavedRate(source, target);

        setRate(saved);
        setManualRate(String(saved));
        setRateDate(readSavedDate(source, target) || 'manuel');
        setLastError('Taux automatique indisponible, taux local utilisé.');
      } finally {
        setLoading(false);
      }
    }

    function swapCurrencies() {
      setFrom(to);
      setTo(from);
    }

    function saveManualRate(value) {
      const nextRate = safeNumber(value);

      setManualRate(value);
      setRate(nextRate);
      setRateDate('manuel');
      setAutoRate(false);

      saveRateToStorage(from, to, nextRate, 'manuel');
    }

    return (
      <div style={cardStyle()}>
        <div style={headerStyle()}>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Icon name="arrow" size={16} style={{ color: 'var(--accent)' }} />
            Convertisseur
          </span>

          {editMode && (
            <button
              type="button"
              onClick={onRemove}
              style={removeButtonStyle()}
            >
              {'\u00d7'}
            </button>
          )}
        </div>

        <div style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <Field label="Montant">
            <input
              value={amount}
              onChange={event => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="100"
              style={{
                ...inputStyle(),
                fontSize: 18,
                fontWeight: 800
              }}
            />
          </Field>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 34px 1fr',
            gap: 8,
            alignItems: 'end'
          }}>
            <Field label="Depuis">
              <select
                value={from}
                onChange={event => setFrom(event.target.value)}
                style={selectStyle()}
              >
                {CURRENCY_OPTIONS.map(function renderCurrency(currency) {
                  return (
                    <option
                      key={currency.code}
                      value={currency.code}
                    >
                      {currency.code} · {currency.label}
                    </option>
                  );
                })}
              </select>
            </Field>

            <button
              type="button"
              onClick={swapCurrencies}
              title="Inverser"
              style={{
                height: 34,
                width: 34,
                borderRadius: 9,
                border: '1px solid var(--outline-variant)',
                background: 'var(--card)',
                color: 'var(--accent)',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <Icon name="arrow" size={14} />
            </button>

            <Field label="Vers">
              <select
                value={to}
                onChange={event => setTo(event.target.value)}
                style={selectStyle()}
              >
                {CURRENCY_OPTIONS.map(function renderCurrency(currency) {
                  return (
                    <option
                      key={currency.code}
                      value={currency.code}
                    >
                      {currency.code} · {currency.label}
                    </option>
                  );
                })}
              </select>
            </Field>
          </div>

          <div style={{
            background: 'var(--inset)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 12,
            padding: '12px 13px'
          }}>
            <div style={{
              fontSize: 11,
              color: 'var(--muted)',
              marginBottom: 4
            }}>
              Résultat estimé
            </div>

            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 26,
              lineHeight: '30px',
              color: 'var(--accent)'
            }}>
              {formatMoney(converted, to)}
            </div>

            <div style={{
              fontSize: 12,
              color: 'var(--muted)',
              marginTop: 4
            }}>
              {formatMoney(amountNumber, from)} ≈ {formatMoney(converted, to)}
            </div>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12.5,
            color: 'var(--muted)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={autoRate}
              onChange={event => setAutoRate(event.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
            />
            Taux automatique
          </label>

          <Field label="Taux utilisé">
            <div style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: 12,
                color: 'var(--muted)',
                whiteSpace: 'nowrap'
              }}>
                1 {from} =
              </span>

              <input
                value={manualRate}
                onChange={event => saveManualRate(event.target.value)}
                inputMode="decimal"
                style={inputStyle()}
              />

              <span style={{
                fontSize: 12,
                color: 'var(--muted)'
              }}>
                {to}
              </span>
            </div>
          </Field>

          <div style={{
            fontSize: 11.5,
            color: lastError ? '#c0563f' : 'var(--faint)',
            lineHeight: '16px'
          }}>
            {loading
              ? 'Mise à jour du taux…'
              : lastError
                ? lastError
                : autoRate
                  ? 'Taux automatique' + (rateDate ? ' · ' + rateDate : '')
                  : 'Taux manuel' + (rateDate ? ' · ' + rateDate : '')}
          </div>

          <button
            type="button"
            onClick={() => fetchRate(from, to)}
            disabled={loading}
            style={{
              width: '100%',
              border: '1px solid var(--outline-variant)',
              background: 'var(--card)',
              color: 'var(--text)',
              borderRadius: 9,
              padding: '8px 10px',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 800,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.72 : 1
            }}
          >
            {loading ? 'Mise à jour…' : 'Actualiser le taux'}
          </button>
        </div>
      </div>
    );
  }

  window.CurrencyWidget = CurrencyWidget;
})();
