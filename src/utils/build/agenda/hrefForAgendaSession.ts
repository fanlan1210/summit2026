import { AGENDA_DAY2_DATE } from './dates'
import { getRelativeLocaleUrl } from 'astro:i18n'

export function hrefForAgendaSession(locale: string, start: string, id: string) {
  const day = start.startsWith(AGENDA_DAY2_DATE) ? 'agenda/day2' : 'agenda/day1'
  return `${getRelativeLocaleUrl(locale, day)}#${encodeURIComponent(id)}`
}
