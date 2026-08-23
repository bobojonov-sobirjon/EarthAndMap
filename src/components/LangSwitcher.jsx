import { useI18n } from '../i18n/I18nContext'

function FlagUz() {
  return (
    <svg viewBox="0 0 12 8" className="flag-svg" aria-hidden>
      <rect width="12" height="8" fill="#1eb53a" />
      <rect width="12" height="5.33" fill="#fff" />
      <rect width="12" height="2.67" fill="#0099b5" />
      <rect y="2.55" width="12" height="0.22" fill="#ce1126" />
      <rect y="5.22" width="12" height="0.22" fill="#ce1126" />
    </svg>
  )
}

function FlagRu() {
  return (
    <svg viewBox="0 0 12 8" className="flag-svg" aria-hidden>
      <rect width="12" height="8" fill="#d52b1e" />
      <rect width="12" height="5.33" fill="#0039a6" />
      <rect width="12" height="2.67" fill="#fff" />
    </svg>
  )
}

function FlagEn() {
  return (
    <svg viewBox="0 0 12 8" className="flag-svg" aria-hidden>
      <rect width="12" height="8" fill="#012169" />
      <path d="M0 0 L12 8 M12 0 L0 8" stroke="#fff" strokeWidth="1.6" />
      <path d="M0 0 L12 8 M12 0 L0 8" stroke="#c8102e" strokeWidth="0.8" />
      <path d="M6 0 V8 M0 4 H12" stroke="#fff" strokeWidth="2.4" />
      <path d="M6 0 V8 M0 4 H12" stroke="#c8102e" strokeWidth="1.2" />
    </svg>
  )
}

const FLAG = { uz: FlagUz, ru: FlagRu, en: FlagEn }

export default function LangSwitcher({ variant = 'text' }) {
  const { lang, setLang, langs } = useI18n()

  if (variant === 'flags') {
    return (
      <div className="flag-switch" role="group" aria-label="Language">
        {langs.map((l) => {
          const Icon = FLAG[l.code]
          return (
            <button
              key={l.code}
              type="button"
              className={lang === l.code ? 'is-on' : ''}
              title={l.label}
              onClick={() => setLang(l.code)}
            >
              {Icon ? <Icon /> : null}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {langs.map((l) => (
        <button
          key={l.code}
          type="button"
          className={lang === l.code ? 'is-on' : ''}
          onClick={() => setLang(l.code)}
        >
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
