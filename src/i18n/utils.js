import { i18n } from 'astro:config/server'
import zhTW from '~/i18n/messages/zh-tw.json'
import en from '~/i18n/messages/en.json'

const PROJECT_NAME = import.meta.env.BASE_URL?.replaceAll(/^\/+|\/+$/g, '')
const defaultLocale = i18n.defaultLocale
const locales = i18n.locales

function normalizePath(path) {
  if (!path.startsWith('/')) path = `/${path}`
  path = path.replace(/\/+/g, '/')
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path
}

export function getLocaleFromPath(pathname) {
  pathname = stripProjectName(pathname)
  const p = normalizePath(pathname)
  const seg = p.split('/').filter(Boolean)[0]?.toLowerCase()
  if (seg && locales.includes(seg)) return seg
  return defaultLocale
}

export function stripProjectName(pathname) {
  const p = normalizePath(pathname)
  return PROJECT_NAME && p.startsWith(`/${PROJECT_NAME}`) ? p.slice(PROJECT_NAME.length + 1) : p
}

const dict = { 'zh-tw': zhTW, en }
export function useI18n(pathname) {
  const locale = getLocaleFromPath(pathname)
  return dict[locale] || dict[defaultLocale]
}
