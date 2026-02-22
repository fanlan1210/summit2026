/**
 * 交通方式標籤頁切換：用於 visit 頁「區塊二：交通方式」的大眾運輸／自行開車標籤
 */
(function initTransportTabs() {
  const nav = document.querySelector('.visit-tabs__nav')
  if (!nav) return
  const tabs = nav.querySelectorAll('[data-tab]')
  const panels = document.querySelectorAll('.visit-tabs__content [data-panel]')
  const activeTabClass = 'visit-tabs__tab--active'
  const activeBorder = 'border-b-2'
  const borderPrimary = 'border-primary'

  tabs.forEach((tab) => {
    tab.addEventListener('click', function () {
      const value = this.getAttribute('data-tab')
      if (!value) return
      tabs.forEach((t) => {
        t.classList.remove(activeTabClass, activeBorder, borderPrimary)
        t.setAttribute('aria-selected', 'false')
      })
      this.classList.add(activeTabClass, activeBorder, borderPrimary)
      this.setAttribute('aria-selected', 'true')
      panels.forEach((panel) => {
        const isActive = panel.getAttribute('data-panel') === value
        panel.classList.toggle('hidden', !isActive)
        panel.setAttribute('aria-hidden', String(!isActive))
      })
    })
  })
})()
