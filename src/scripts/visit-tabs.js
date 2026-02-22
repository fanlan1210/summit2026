/**
 * 交通方式標籤頁切換：用於 visit 頁「區塊二：交通方式」的大眾運輸／自行開車標籤
 */
(function initTransportTabs() {
  const nav = document.querySelector('.visit-tabs__nav')
  if (!nav) return
  const tabs = nav.querySelectorAll('[data-tab]')
  const panels = document.querySelectorAll('.visit-tabs__content [data-panel]')
  const activeTabClass = 'visit-tabs__tab--active'
  const borderInfoDark = 'border-info-dark'
  const borderTransparent = 'border-transparent'
  const textInfoDark = 'text-info-dark'
  const textInfo = 'text-info'

  tabs.forEach((tab) => {
    tab.addEventListener('click', function () {
      const value = this.getAttribute('data-tab')
      if (!value) return
      tabs.forEach((t) => {
        t.classList.remove(activeTabClass, borderInfoDark, textInfoDark)
        t.classList.add(borderTransparent, textInfo)
        t.setAttribute('aria-selected', 'false')
      })
      this.classList.remove(borderTransparent, textInfo)
      this.classList.add(activeTabClass, borderInfoDark, textInfoDark)
      this.setAttribute('aria-selected', 'true')
      panels.forEach((panel) => {
        const isActive = panel.getAttribute('data-panel') === value
        panel.classList.toggle('hidden', !isActive)
        panel.setAttribute('aria-hidden', String(!isActive))
      })
    })
  })
})()
