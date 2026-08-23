const KNOWN = [
  [/network error/i, 'msg.network'],
  [/timeout/i, 'msg.network'],
  [/already exists/i, 'err.usernameTaken'],
  [/уже существует/i, 'err.usernameTaken'],
  [/allaqachon/i, 'err.usernameTaken'],
  [/valid email/i, 'err.emailInvalid'],
  [/too short/i, 'err.pwdShort'],
  [/too common/i, 'err.pwdCommon'],
  [/entirely numeric/i, 'err.pwdNumeric'],
  [/no file/i, 'import.needFile'],
  [/permission|forbidden|not allowed/i, 'msg.forbidden'],
  [/not found/i, 'msg.notFound'],
]

export function pickApiError(err) {
  const d = err?.response?.data
  if (!d) return err?.message || ''
  if (typeof d === 'string') return d
  if (typeof d.detail === 'string') return d.detail
  if (Array.isArray(d.detail)) return String(d.detail[0] || '')
  const first = Object.values(d).flat()?.[0]
  return typeof first === 'string' ? first : ''
}

/** Always return a string in the active UI language. */
export function apiError(err, t, fallbackKey = 'msg.error') {
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return t('msg.network')
  }
  const raw = pickApiError(err)
  if (raw) {
    const hit = KNOWN.find(([re]) => re.test(raw))
    if (hit) return t(hit[1])
  }
  return t(fallbackKey)
}
