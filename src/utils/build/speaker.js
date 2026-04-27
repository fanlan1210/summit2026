const stools = [
  `${import.meta.env.BASE_URL}/img/banner/g0v_stool-nbg-b-s.svg`,
  `${import.meta.env.BASE_URL}/img/banner/g0v_stool-nbg-g-m.svg`,
  `${import.meta.env.BASE_URL}/img/banner/g0v_stool-nbg-r-l.svg`,
  `${import.meta.env.BASE_URL}/img/banner/g0v_stool-nbg-y-s.svg`,
]

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

export function isDefaultAvatar(speaker) {
  return !speaker.avatar || speaker.avatar.includes('avatars/default')
}

export function getAvatar(speaker) {
  if (isDefaultAvatar(speaker)) {
    return getDefaultAvatar(getLocalizedSpeakerName(speaker, 'zh-tw'))
  }

  if (speaker.avatar.includes('summit.g0v.tw/2026')) {
    const filename = speaker.avatar.split('/').pop()
    return `${import.meta.env.BASE_URL}img/avatars/${filename}`
  }

  if (speaker.avatar.startsWith('http')) {
    return speaker.avatar
  }
}

export function getDefaultAvatar(name) {
  return stools[stringToNumber(name, 0, stools.length - 1)]
}

function stringToNumber(str, from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    throw new TypeError('from 和 to 必須是整數')
  }

  if (from > to) {
    ;[from, to] = [to, from]
  }

  let hash = 2166136261

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  const range = to - from + 1
  return from + ((hash >>> 0) % range)
}
