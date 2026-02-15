import { i18n } from 'astro:config/server'

const locales = i18n.locales
const PROJECT_NAME = import.meta.env.BASE_URL

export function pathnameWithoutBaseAndLocale(rawPathname) {
  let pathname = rawPathname.replace(PROJECT_NAME, '')
  locales.forEach(locale => {
    const regex = new RegExp(`^${locale}`)
    pathname = pathname.replace(regex, '')
  })
  return pathname
}
