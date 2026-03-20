/**
 * Date utilities for Seoul timezone (Asia/Seoul)
 * Ensures consistent date handling regardless of server location
 */

const SEOUL_TIMEZONE = 'Asia/Seoul'
const KST_OFFSET_HOURS = 9
export const SEOUL_SUBMISSION_START_MINUTES = 8 * 60 + 50
export const SEOUL_SUBMISSION_END_MINUTES = 23 * 60 + 30

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


// Check whether current Seoul time is within submission window.
export function isWithinSeoulSubmissionWindow(date = new Date()): boolean {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: SEOUL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')
  const currentMinutes = hour * 60 + minute

  return currentMinutes >= SEOUL_SUBMISSION_START_MINUTES && currentMinutes <= SEOUL_SUBMISSION_END_MINUTES
}

// Check whether current Seoul date is weekend (Saturday or Sunday).
export function isSeoulWeekend(date = new Date()): boolean {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: SEOUL_TIMEZONE,
    weekday: 'short',
  }).format(date)

  return weekday === 'Sat' || weekday === 'Sun'
}
