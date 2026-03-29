function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function getLocalizedSpeakerField(speaker, field, locale) {
  const isZhTW = locale === 'zh-tw'
  const primary = isZhTW ? normalizeText(speaker?.zh?.[field]) : normalizeText(speaker?.en?.[field])
  const fallback = isZhTW ? normalizeText(speaker?.en?.[field]) : normalizeText(speaker?.zh?.[field])
  return primary || fallback
}

export function getSpeakerProfile(speaker, locale) {
  const name = getLocalizedSpeakerField(speaker, 'name', locale)
  const bio = getLocalizedSpeakerField(speaker, 'bio', locale)
  const otherName = locale === 'zh-tw' ? normalizeText(speaker?.en?.name) : normalizeText(speaker?.zh?.name)

  return {
    name,
    bio,
    otherName: otherName !== name ? otherName : '',
  }
}

export function getLocalizedSpeakerName(speaker, locale) {
  return getLocalizedSpeakerField(speaker, 'name', locale)
}
