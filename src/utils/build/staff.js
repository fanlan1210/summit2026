import { isMandarinPreferred } from '~/i18n/utils'

export function getLocalizedStaffName(person, locale) {
  const zhName = person.name?.zh?.trim()
  const enName = person.name?.en?.trim()
  const nickname = person.nickname?.trim()

  if (isMandarinPreferred(locale)) return zhName || nickname || enName || person.id
  return enName || zhName || nickname || person.id
}

export function hasStaffIntro(person) {
  return Boolean(person.intro?.trim())
}
