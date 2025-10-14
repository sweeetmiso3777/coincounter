import { Timestamp } from "firebase/firestore"

/**
 * Converts various date formats to a JavaScript Date object
 */
export function toDate(date: Timestamp | Date | string | number): Date {
  if (date instanceof Date) {
    return date
  }
  if (date instanceof Timestamp) {
    return date.toDate()
  }
  if (typeof date === "string" || typeof date === "number") {
    return new Date(date)
  }
  throw new Error("Invalid date format")
}

/**
 * Converts a Date to a Firebase Timestamp
 */
export function toTimestamp(date: Date | string | number): Timestamp {
  const dateObj = date instanceof Date ? date : new Date(date)
  return Timestamp.fromDate(dateObj)
}

/**
 * Adds days to a date
 */
export function addDays(date: Timestamp | Date | string | number, days: number): Date {
  const dateObj = toDate(date)
  const result = new Date(dateObj)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Subtracts days from a date
 */
export function subtractDays(date: Timestamp | Date | string | number, days: number): Date {
  return addDays(date, -days)
}

/**
 * Gets yesterday's date at midnight
 */
export function getYesterday(): Date {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  return yesterday
}

/**
 * Gets today's date at midnight
 */
export function getToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Formats a date as a readable string (e.g., "January 15, 2025")
 */
export function formatDate(date: Timestamp | Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = toDate(date)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }
  return dateObj.toLocaleDateString("en-US", defaultOptions)
}

/**
 * Formats a date as a short string (e.g., "Jan 15, 2025")
 */
export function formatDateShort(date: Timestamp | Date | string | number): string {
  return formatDate(date, { month: "short" })
}

/**
 * Formats a date range (e.g., "January 15, 2025 to February 14, 2025")
 */
export function formatDateRange(
  startDate: Timestamp | Date | string | number | null | undefined,
  endDate: Timestamp | Date | string | number,
): string {
  const endDateStr = formatDate(endDate)

  if (!startDate) {
    return `Beginning to ${endDateStr}`
  }

  const startDateStr = formatDate(startDate)
  return `${startDateStr} to ${endDateStr}`
}

/**
 * Formats a date range as short strings (e.g., "Jan 15 - Feb 14, 2025")
 */
export function formatDateRangeShort(
  startDate: Timestamp | Date | string | number | null | undefined,
  endDate: Timestamp | Date | string | number,
): string {
  const endDateObj = toDate(endDate)
  const endYear = endDateObj.getFullYear()

  if (!startDate) {
    return `Beginning - ${formatDateShort(endDate)}`
  }

  const startDateObj = toDate(startDate)
  const startMonth = startDateObj.toLocaleDateString("en-US", { month: "short" })
  const startDay = startDateObj.getDate()
  const endMonth = endDateObj.toLocaleDateString("en-US", { month: "short" })
  const endDay = endDateObj.getDate()

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`
}

/**
 * Checks if a date is before another date
 */
export function isBefore(
  date1: Timestamp | Date | string | number,
  date2: Timestamp | Date | string | number,
): boolean {
  return toDate(date1).getTime() < toDate(date2).getTime()
}

/**
 * Checks if a date is after another date
 */
export function isAfter(date1: Timestamp | Date | string | number, date2: Timestamp | Date | string | number): boolean {
  return toDate(date1).getTime() > toDate(date2).getTime()
}

/**
 * Checks if two dates are the same day
 */
export function isSameDay(
  date1: Timestamp | Date | string | number,
  date2: Timestamp | Date | string | number,
): boolean {
  const d1 = toDate(date1)
  const d2 = toDate(date2)
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

/**
 * Gets the number of days between two dates
 */
export function getDaysBetween(
  startDate: Timestamp | Date | string | number,
  endDate: Timestamp | Date | string | number,
): number {
  const start = toDate(startDate)
  const end = toDate(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Formats a date for display in forms (YYYY-MM-DD)
 */
export function formatDateForInput(date: Timestamp | Date | string | number): string {
  const dateObj = toDate(date)
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, "0")
  const day = String(dateObj.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Gets the start of day (midnight) for a given date
 */
export function startOfDay(date: Timestamp | Date | string | number): Date {
  const dateObj = toDate(date)
  dateObj.setHours(0, 0, 0, 0)
  return dateObj
}

/**
 * Gets the end of day (23:59:59.999) for a given date
 */
export function endOfDay(date: Timestamp | Date | string | number): Date {
  const dateObj = toDate(date)
  dateObj.setHours(23, 59, 59, 999)
  return dateObj
}
