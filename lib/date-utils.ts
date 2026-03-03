/**
 * Date utilities for Seoul timezone (Asia/Seoul)
 * Ensures consistent date handling regardless of server location
 */

const SEOUL_TIMEZONE = 'Asia/Seoul'
const KST_OFFSET_HOURS = 9

function getSeoulDateParts(date = new Date()): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SEOUL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(date)
  const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value

  return {
    year: Number(getPart('year')),
    month: Number(getPart('month')),
    day: Number(getPart('day')),
  }
}

/**
 * Get current date in Seoul timezone
 */
export function getSeoulDate(): Date {
  const now = new Date()
  const localOffsetMs = now.getTimezoneOffset() * 60 * 1000
  const utcMs = now.getTime() + localOffsetMs
  const seoulMs = utcMs + KST_OFFSET_HOURS * 60 * 60 * 1000
  return new Date(seoulMs)
}

/**
 * Get current year and month in Seoul timezone
 */
export function getSeoulYearMonth(): { year: number; month: number } {
  const seoulDate = getSeoulDateParts()
  return {
    year: seoulDate.year,
    month: seoulDate.month
  }
}

/**
 * Get start and end dates for a month in Seoul timezone
 * Returns ISO strings
 */
export function getSeoulMonthRange(year: number, month: number): { startDate: string; endDate: string } {
  // Convert Seoul month boundaries to UTC ISO strings.
  // Seoul does not use DST, so fixed +09:00 offset is safe.
  const startUtcMs = Date.UTC(year, month - 1, 1, 0, 0, 0, 0) - KST_OFFSET_HOURS * 60 * 60 * 1000
  const nextMonthStartUtcMs = Date.UTC(year, month, 1, 0, 0, 0, 0) - KST_OFFSET_HOURS * 60 * 60 * 1000

  return {
    startDate: new Date(startUtcMs).toISOString(),
    endDate: new Date(nextMonthStartUtcMs - 1).toISOString()
  }
}

/**
 * Format date string to Korean locale with Seoul timezone
 */
export function formatSeoulDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleString("ko-KR", {
      timeZone: SEOUL_TIMEZONE,
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateString
  }
}
