let count = 0
const listeners = new Set()

function emit() {
  listeners.forEach((fn) => fn(count))
}

export function subscribePending(fn) {
  listeners.add(fn)
  fn(count)
  return () => listeners.delete(fn)
}

export function trackRequestStart() {
  count += 1
  emit()
}

export function trackRequestEnd() {
  count = Math.max(0, count - 1)
  emit()
}

export function pendingCount() {
  return count
}

export function shouldTrackProgress(config) {
  if (config?.skipProgress) return false
  const url = `${config?.url || ''} ${config?.baseURL || ''}`
  if (url.includes('/auth/refresh')) return false
  return true
}
