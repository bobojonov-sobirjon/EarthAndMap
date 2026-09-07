import { useMemo, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'

function fmt(n, d = 1) {
  const x = Number(n ?? 0)
  if (!Number.isFinite(x)) return '—'
  return x.toLocaleString(undefined, { maximumFractionDigits: d })
}

function Accordion({ title, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`mfy-acc${open ? ' is-open' : ''}`}>
      <button type="button" className="mfy-acc__btn" onClick={() => setOpen((v) => !v)}>
        <span>{title}{count != null ? ` (${count})` : ''}</span>
        <span className="mfy-acc__chev" aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="mfy-acc__body">{children}</div>}
    </div>
  )
}

function ItemList({ items, unit = 'ga', onPick, emptyLabel }) {
  if (!items?.length) {
    return <p className="mfy-acc__empty">{emptyLabel || '—'}</p>
  }
  return (
    <ol className="mfy-acc__list">
      {items.map((it, i) => (
        <li key={it.id ?? `${it.name}-${i}`}>
          <button
            type="button"
            className="mfy-acc__item"
            onClick={() => onPick?.(it)}
          >
            <span className="mfy-acc__item-name">{i + 1}. {it.name}</span>
            <span className="mfy-acc__item-meta">
              {unit === 'km'
                ? `${fmt(it.lengthKm, 2)} km`
                : `${fmt(it.areaHa, 2)} ga`}
            </span>
          </button>
        </li>
      ))}
    </ol>
  )
}

/**
 * Chap panel: MFY atributlari, ko‘rsatkichlar va obyektlar ro‘yxati.
 */
export default function MfyAnalysisPanel({ passport, onClose, onPickObject, onBack }) {
  const { t } = useI18n()
  const [tab, setTab] = useState('objects')

  const summary = useMemo(() => {
    if (!passport) return []
    return [
      { id: 'roads', icon: 'road', label: t('map.mfyAnal.roads'), value: `${fmt(passport.roadKm, 1)} km` },
      { id: 'streets', icon: 'street', label: t('map.mfyAnal.streets'), value: `${fmt(passport.streetKm, 1)} km` },
      { id: 'ariq', icon: 'ariq', label: t('map.mfyAnal.ariqs'), value: `${fmt(passport.ariqKm, 1)} km` },
      { id: 'kanal', icon: 'kanal', label: t('map.mfyAnal.canals'), value: `${fmt(passport.kanalKm, 1)} km` },
      { id: 'cem', icon: 'cem', label: t('map.mfyAnal.cemeteries'), value: String(passport.cemeteries ?? 0) },
      { id: 'park', icon: 'park', label: t('map.mfyAnal.parks'), value: String(passport.parks ?? 0) },
      { id: 'other', icon: 'other', label: t('map.mfyAnal.other'), value: String(passport.other ?? 0) },
    ]
  }, [passport, t])

  if (!passport) return null

  return (
    <aside className="mfy-anal" role="dialog" aria-label={t('map.mfyAnal.title')}>
      <header className="mfy-anal__head">
        <button type="button" className="mfy-anal__back" onClick={onBack || onClose}>
          ← {t('map.mfyAnal.back')}
        </button>
        <div className="mfy-anal__title-row">
          <h2>{passport.name}</h2>
          {onClose && (
            <button type="button" className="mfy-anal__close" onClick={onClose} aria-label={t('common.close')}>
              ×
            </button>
          )}
        </div>
        <div className="mfy-anal__kpis">
          <div>
            <span>{t('map.mfyAnal.area')}</span>
            <b>{fmt(passport.areaHa, 1)} ga</b>
          </div>
          <div>
            <span>{t('map.mfyAnal.objects')}</span>
            <b>{passport.total ?? 0}</b>
          </div>
        </div>
      </header>

      <nav className="mfy-anal__tabs" aria-label={t('map.mfyAnal.tabs')}>
        <button
          type="button"
          className={tab === 'main' ? 'is-active' : ''}
          onClick={() => setTab('main')}
        >
          {t('map.mfyAnal.tabMain')}
        </button>
        <button
          type="button"
          className={tab === 'objects' ? 'is-active' : ''}
          onClick={() => setTab('objects')}
        >
          {t('map.mfyAnal.tabObjects')}
        </button>
      </nav>

      <div className="mfy-anal__body">
        {tab === 'main' && (
          <ul className="mfy-anal__summary">
            {summary.map((row) => (
              <li key={row.id} className={`mfy-anal__sum mfy-anal__sum--${row.icon}`}>
                <span className="mfy-anal__sum-ico" aria-hidden />
                <span className="mfy-anal__sum-lab">{row.label}</span>
                <b>{row.value}</b>
              </li>
            ))}
          </ul>
        )}

        {tab === 'objects' && (
          <>
            <ul className="mfy-anal__summary mfy-anal__summary--compact">
              {summary.map((row) => (
                <li key={row.id} className={`mfy-anal__sum mfy-anal__sum--${row.icon}`}>
                  <span className="mfy-anal__sum-ico" aria-hidden />
                  <span className="mfy-anal__sum-lab">{row.label}</span>
                  <b>{row.value}</b>
                </li>
              ))}
            </ul>

            <div className="mfy-anal__accs">
              <Accordion title={t('map.mfyAnal.cemeteries')} count={passport.cemeteries} defaultOpen={(passport.cemeteries || 0) > 0}>
                <ItemList
                  items={passport.cemeteryList}
                  unit="ga"
                  onPick={onPickObject}
                  emptyLabel={t('map.mfyAnal.empty')}
                />
              </Accordion>
              <Accordion title={t('map.mfyAnal.parks')} count={passport.parks} defaultOpen={(passport.parks || 0) > 0}>
                <ItemList
                  items={passport.parkList}
                  unit="ga"
                  onPick={onPickObject}
                  emptyLabel={t('map.mfyAnal.empty')}
                />
              </Accordion>
              <Accordion title={t('map.mfyAnal.roads')} count={passport.roadList?.length} defaultOpen={(passport.roadList?.length || 0) > 0}>
                <ItemList
                  items={passport.roadList}
                  unit="km"
                  onPick={onPickObject}
                  emptyLabel={t('map.mfyAnal.empty')}
                />
              </Accordion>
              <Accordion title={t('map.mfyAnal.streets')} count={passport.streetList?.length} defaultOpen={(passport.streetList?.length || 0) > 0}>
                <ItemList
                  items={passport.streetList}
                  unit="km"
                  onPick={onPickObject}
                  emptyLabel={t('map.mfyAnal.empty')}
                />
              </Accordion>
              <Accordion title={t('map.mfyAnal.ariqs')} count={passport.ariqList?.length}>
                <ItemList
                  items={passport.ariqList}
                  unit="km"
                  onPick={onPickObject}
                  emptyLabel={t('map.mfyAnal.empty')}
                />
              </Accordion>
              <Accordion title={t('map.mfyAnal.canals')} count={passport.kanalList?.length}>
                <ItemList
                  items={passport.kanalList}
                  unit="km"
                  onPick={onPickObject}
                  emptyLabel={t('map.mfyAnal.empty')}
                />
              </Accordion>
              {(passport.other > 0) && (
                <Accordion title={t('map.mfyAnal.other')} count={passport.other} defaultOpen>
                  <ItemList
                    items={passport.otherList}
                    unit="ga"
                    onPick={onPickObject}
                    emptyLabel={t('map.mfyAnal.empty')}
                  />
                </Accordion>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
