/**
 * Date utilities for Seoul timezone (Asia/Seoul)
 * Ensures consistent date handling regardless of server location
 */

const SEOUL_TIMEZONE = 'Asia/Seoul'

/**
 * Get current date in Seoul timezone
 */
export function getSeoulDate(): Date {
  const now = new Date()
  const seoulTimeString = now.toLocaleString('en-US', { timeZone: SEOUL_TIMEZONE })
  return new Date(seoulTimeString)
}

/**
 * Get current year and month in Seoul timezone
 */
export function getSeoulYearMonth(): { year: number; month: number } {
  const seoulDate = getSeoulDate()
  return {
    year: seoulDate.getFullYear(),
    month: seoulDate.getMonth() + 1
  }
}

/**
 * Get start and end dates for a month in Seoul timezone
 * Returns ISO strings
 */
export function getSeoulMonthRange(year: number, month: number): { startDate: string; endDate: string } {
  // Create dates at midnight Seoul time for start of month
  const startDate = new Date(
    new Date(year, month - 1, 1).toLocaleString('en-US', { timeZone: SEOUL_TIMEZONE })
  )
  
  // Create date at end of month (23:59:59) Seoul time
  const endDate = new Date(
    new Date(year, month, 0, 23, 59, 59, 999).toLocaleString('en-US', { timeZone: SEOUL_TIMEZONE })
  )
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
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
