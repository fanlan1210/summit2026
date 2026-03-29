const TIME_ZONE = 'Asia/Taipei'

type DateValue = string | Date

function formatTimeZoneToParts(date: DateValue, options: Intl.DateTimeFormatOptions) {
  const value = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    ...options,
  }).formatToParts(value)
}

export function formatMMdd(date: DateValue) {
  const parts = formatTimeZoneToParts(date, {
    month: '2-digit',
    day: '2-digit',
  })

  const month = parts.find(part => part.type === 'month')?.value ?? '00'
  const day = parts.find(part => part.type === 'day')?.value ?? '00'

  return `${month}/${day}`
}

export function formatHHmm(date: DateValue) {
  const parts = formatTimeZoneToParts(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const hour = parts.find(part => part.type === 'hour')?.value ?? '00'
  const minute = parts.find(part => part.type === 'minute')?.value ?? '00'

  return `${hour}:${minute}`
}
