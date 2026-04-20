export function updateLocationHash(id?: string) {
  if (!id) return

  const url = new URL(location.href)
  url.hash = encodeURIComponent(id)
  history.replaceState(history.state, '', url)
}

export function clearLocationHash() {
  if (!location.hash) return

  history.replaceState(history.state, '', `${location.pathname}${location.search}`)
}

export function getVisibleElementFromHash(selectorForId: (id: string) => string): HTMLElement | null {
  const raw = location.hash.slice(1)
  if (!raw) return null

  let id: string
  try {
    id = decodeURIComponent(raw)
  } catch {
    return null
  }

  const nodes = document.querySelectorAll<HTMLElement>(selectorForId(CSS.escape(id)))
  return Array.from(nodes).find(el => isVisible(el)) ?? nodes[0] ?? null
}

export function isVisible(el?: HTMLElement | null) {
  if (!el) return false

  const style = window.getComputedStyle(el)
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 0 && el.offsetHeight > 0
}
