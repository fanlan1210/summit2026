import { i18n } from 'astro:config/server'
import zhTW from '~/i18n/messages/zh-tw.json'
import en from '~/i18n/messages/en.json'
import hakTW from '~/i18n/messages/hak-tw.json'
import nanTW from '~/i18n/messages/nan-tw.json'

const PROJECT_NAME = import.meta.env.BASE_URL?.replaceAll(/^\/+|\/+$/g, '')
const defaultLocale = i18n.defaultLocale
const locales = i18n.locales

export function isMandarinPreferred(locale) {
  // theoretically we should only use `zh` in locales ['zh-tw', 'man-tw', 'hak-tw', 'nan-tw']
  // but we’ll cheat a bit before we introduce any other languages (e.g., `ja`)
  return locale !== 'en'
}

export function getLocaleFromPath(pathname) {
  pathname = stripProjectName(pathname)
  const p = normalizePath(pathname)
  const seg = p.split('/').filter(Boolean)[0]?.toLowerCase()
  if (seg && locales.includes(seg)) return seg
  return defaultLocale
}

function normalizePath(path) {
  if (!path.startsWith('/')) path = `/${path}`
  path = path.replace(/\/+/g, '/')
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path
}

function stripProjectName(pathname) {
  const p = normalizePath(pathname)
  return PROJECT_NAME && p.startsWith(`/${PROJECT_NAME}`) ? p.slice(PROJECT_NAME.length + 1) : p
}

function derive(base, diff) {
  let result = { ...base }
  for (const key in diff) {
    // Perform deep merge for each layer of diffed object
    if (typeof diff[key] == 'object') {
      result[key] = derive(base[key], diff[key])
    } else {
      result[key] = diff[key]
    }
  }
  return result
}

const dict = {
  'zh-tw': zhTW,
  en,
  'hak-tw': derive(zhTW, hakTW),
  'nan-tw': derive(zhTW, nanTW)
}
export function useI18n(pathname) {
  const locale = getLocaleFromPath(pathname)
  return {
    t(key) {
      return key.split('.').reduce((obj, k) => obj?.[k], dict[locale]) ?? key
    },
  }
}
