/** Monitoring years: 2010 … current calendar year (not a fixed even-year list). */
export const YEAR_FROM = 2010

export function yearList(from = YEAR_FROM, to = new Date().getFullYear()) {
  const end = Math.max(Number(to) || from, from)
  const years = []
  for (let y = from; y <= end; y += 1) years.push(y)
  return years
}

export const YEARS = yearList()
export const CURRENT_YEAR = YEARS[YEARS.length - 1]
