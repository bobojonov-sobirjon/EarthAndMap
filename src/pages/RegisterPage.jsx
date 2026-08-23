import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/services'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import PrettySelect from '../components/PrettySelect'
import { REGION_OPTIONS, districtsOf } from '../constants/uzbekistanRegions'
import { useI18n } from '../i18n/I18nContext'
import { apiError } from '../i18n/apiError'

const EMPTY = {
  username: '', email: '', password: '', password_confirm: '',
  first_name: '', last_name: '', organization: '', phone: '',
  job_title: '', sector: '', region: '', district: '', purpose: '',
  interest_layers: '', comment: '',
}

const STEPS = [
  { id: 0, title: 'Kimligingiz' },
  { id: 1, title: 'Himoya' },
  { id: 2, title: 'Tashkilot' },
]

const SECTORS = [
  { v: 'davlat', l: 'Davlat idorasi' },
  { v: 'kadastr', l: 'Kadastr / yer' },
  { v: 'arxitektura', l: 'Arxitektura / qurilish' },
  { v: 'ekologiya', l: 'Ekologiya' },
  { v: 'talim', l: 'Ta’lim / ilmiy' },
  { v: 'jamoat', l: 'Jamoat / NNT' },
  { v: 'boshqa', l: 'Boshqa' },
]

const PURPOSES = [
  { v: 'monitoring', l: 'Monitoring' },
  { v: 'reyestr', l: 'Reyestr' },
  { v: 'tahlil', l: 'Tahlil / hisobot' },
  { v: 'talim', l: 'O‘qish / tadqiqot' },
  { v: 'boshqa', l: 'Boshqa' },
]

const LAYERS = [
  { v: 'istirohat', l: 'Bog‘lar' },
  { v: 'yollar', l: 'Yo‘llar' },
  { v: 'suv', l: 'Sug‘orish' },
  { v: 'qabriston', l: 'Qabriston' },
]

function Field({ label, required, children, wide }) {
  return (
    <label className={wide ? 'auth-span-2' : undefined}>
      {label}{required ? ' *' : ''}
      {children}
    </label>
  )
}

export default function RegisterPage() {
  const { t } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const layers = form.interest_layers ? form.interest_layers.split(',').filter(Boolean) : []
  const toggleLayer = (v) => {
    const next = layers.includes(v) ? layers.filter((x) => x !== v) : [...layers, v]
    setForm((p) => ({ ...p, interest_layers: next.join(',') }))
  }

  const mismatch = form.password_confirm.length > 0 && form.password !== form.password_confirm
  const shortPwd = form.password.length > 0 && form.password.length < 6

  const next = (e) => {
    e.preventDefault()
    setError('')
    if (step === 0) {
      if (!form.username.trim()) return setError(t('reg.needUser'))
      if (!form.email.trim()) return setError(t('reg.needEmail'))
    }
    if (step === 1) {
      if (form.password.length < 6) return setError(t('reg.pwdShort'))
      if (form.password !== form.password_confirm) return setError(t('reg.pwdMismatch'))
    }
    if (step < 2) setStep((s) => s + 1)
    else submit()
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      await authApi.register(form)
      await login(form.username, form.password)
      navigate('/')
    } catch (err) {
      setError(apiError(err, t, 'reg.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      wide
      title={t('reg.title')}
      subtitle={t('reg.sub')}
      footer={(
        <p className="auth-switch">
          {t('auth.hasAccount')} <Link to="/login">{t('auth.login')}</Link>
        </p>
      )}
    >
      <ol className="reg-steps">
        {STEPS.map((s) => (
          <li key={s.id} className={step === s.id ? 'is-on' : step > s.id ? 'is-done' : ''}>
            <b>{s.id + 1}</b>
            <span>{t(`reg.step.${s.id}`)}</span>
          </li>
        ))}
      </ol>

      <form className="auth-form auth-form--grid" onSubmit={next}>
        {error && <div className="error-msg auth-span-2">{error}</div>}

        {step === 0 && (
          <div className="auth-form--grid auth-span-2" key="s0">
            <Field label={t('reg.firstName')}>
              <input placeholder="Ali" autoComplete="given-name" value={form.first_name} onChange={set('first_name')} />
            </Field>
            <Field label={t('reg.lastName')}>
              <input placeholder="Valiyev" autoComplete="family-name" value={form.last_name} onChange={set('last_name')} />
            </Field>
            <Field label={t('auth.username')} required>
              <input required placeholder="ali.valiyev" autoComplete="username" value={form.username} onChange={set('username')} />
            </Field>
            <Field label={t('reg.email')} required>
              <input required type="email" placeholder="ali@tashkilot.uz" autoComplete="email" value={form.email} onChange={set('email')} />
            </Field>
            <Field label={t('reg.phone')} wide>
              <input placeholder="+998 90 000 00 00" autoComplete="tel" value={form.phone} onChange={set('phone')} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="auth-form--grid auth-span-2" key="s1">
            <Field label={t('auth.password')} required>
              <input
                required
                type="password"
                placeholder="Kamida 6 belgi"
                autoComplete="new-password"
                className={shortPwd ? 'is-bad' : ''}
                value={form.password}
                onChange={set('password')}
              />
            </Field>
            <Field label={t('reg.confirm')} required>
              <input
                required
                type="password"
                placeholder="Qayta kiriting"
                autoComplete="new-password"
                className={mismatch ? 'is-bad' : ''}
                value={form.password_confirm}
                onChange={set('password_confirm')}
              />
            </Field>
            {shortPwd && <p className="auth-live-err auth-span-2">{t('reg.pwdShort')}</p>}
            {mismatch && <p className="auth-live-err auth-span-2">{t('reg.pwdMismatch')}</p>}
            {!shortPwd && !mismatch && form.password_confirm.length > 0 && (
              <p className="auth-live-ok auth-span-2">{t('reg.pwdOk')}</p>
            )}
            <p className="muted auth-span-2">{t('reg.hintAdmin')}</p>
          </div>
        )}

        {step === 2 && (
          <div className="auth-form--grid auth-span-2" key="s2">
            <Field label="Tashkilot">
              <input placeholder="Masalan: kadastr palatasi" value={form.organization} onChange={set('organization')} />
            </Field>
            <Field label="Lavozim">
              <input placeholder="Mutaxassis, tadqiqotchi…" value={form.job_title} onChange={set('job_title')} />
            </Field>
            <Field label="Sektor">
              <PrettySelect
                value={form.sector}
                onChange={(v) => setForm((p) => ({ ...p, sector: v }))}
                options={SECTORS.map((o) => ({ value: o.v, label: o.l }))}
              />
            </Field>
            <Field label="Viloyat">
              <PrettySelect
                value={form.region}
                onChange={(v) => setForm((p) => ({ ...p, region: v, district: '' }))}
                options={REGION_OPTIONS}
                placeholder="Avval viloyatni tanlang"
                noOptionsMessage="Topilmadi"
              />
            </Field>
            <Field label="Tuman / shahar" wide>
              <PrettySelect
                value={form.district}
                onChange={(v) => setForm((p) => ({ ...p, district: v }))}
                options={districtsOf(form.region)}
                isDisabled={!form.region}
                placeholder={form.region ? 'Tumanni tanlang' : 'Avval viloyat tanlang'}
                noOptionsMessage="Topilmadi"
              />
            </Field>
            <Field label="Tizimdan maqsad" wide>
              <div className="reg-picks">
                {PURPOSES.map((o) => (
                  <button key={o.v} type="button" className={form.purpose === o.v ? 'is-on' : ''} onClick={() => setForm((p) => ({ ...p, purpose: o.v }))}>
                    {o.l}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Qaysi qatlamlar qiziq?" wide>
              <div className="reg-picks">
                {LAYERS.map((o) => (
                  <button key={o.v} type="button" className={layers.includes(o.v) ? 'is-on' : ''} onClick={() => toggleLayer(o.v)}>
                    {o.l}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Nima bilan ishlamoqchisiz?" wide>
              <textarea rows={3} placeholder="Masalan: 2018–2026 bog‘lar maydonini taqqoslash…" value={form.comment} onChange={set('comment')} />
            </Field>
          </div>
        )}

        <div className="auth-form-actions auth-span-2">
          {step > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>{t('common.back')}</button>
          )}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading || (step === 1 && (mismatch || shortPwd))}>
            {loading ? t('reg.creating') : step < 2 ? t('common.continue') : t('reg.create')}
          </button>
        </div>
      </form>
    </AuthShell>
  )
}
