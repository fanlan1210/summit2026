const stools = [
  `${import.meta.env.BASE_URL}/img/banner/g0v_stool-nbg-b-s.svg`,
  `${import.meta.env.BASE_URL}/img/banner/g0v_stool-nbg-g-m.svg`,
  `${import.meta.env.BASE_URL}/img/banner/g0v_stool-nbg-r-l.svg`,
  `${import.meta.env.BASE_URL}/img/banner/g0v_stool-nbg-y-s.svg`,
]

const DEFAULT_AVATAR_SEGMENT = 'avatars/default'
const PRODUCTION_SUMMIT_AVATAR_SEGMENT = 'summit.g0v.tw/2026'

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
  return !speaker?.avatar || speaker.avatar.includes(DEFAULT_AVATAR_SEGMENT)
}

export function getAvatar(speaker) {
  const avatar = speaker?.avatar

  if (isDefaultAvatar(speaker)) {
    return getDefaultAvatar(getLocalizedSpeakerName(speaker, 'zh-tw'))
  }

  if (isProductionSummitAvatar(avatar)) {
    return toLocalAvatarPath(getAvatarFilename(avatar))
  }

  if (isRemoteAvatar(avatar)) {
    return avatar
  }

  return toLocalAvatarPath(avatar)
}

export function getDefaultAvatar(name) {
  return stools[stringToNumber(name, 0, stools.length - 1)]
}

function isProductionSummitAvatar(avatar) {
  return typeof avatar === 'string' && avatar.includes(PRODUCTION_SUMMIT_AVATAR_SEGMENT)
}

function isRemoteAvatar(avatar) {
  return typeof avatar === 'string' && avatar.startsWith('http')
}

function getAvatarFilename(avatar) {
  return avatar.split('/').pop()?.split('?')[0] || ''
}

function toLocalAvatarPath(filename) {
  return `${import.meta.env.BASE_URL}img/avatars/${filename}`
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
