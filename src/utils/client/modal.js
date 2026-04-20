const modalEl = document.querySelector('#modal')
const modalBoxEl = document.querySelector('#modal > div')
const modalHeaderEl = document.querySelector('#modal .modal-header')
const modalBodyEl = document.querySelector('#modal .modal-body')

export function showModal() {
  modalEl.classList.add('show')
  document.body.classList.add('overflow-hidden')
}

export function hideModal() {
  modalEl.classList.remove('show')
  document.body.classList.remove('overflow-hidden')
  window.dispatchEvent(new CustomEvent('modal:hide'))
}

export function showModalWith({ header, body, size = 'sm' }) {
  modalHeaderEl.innerHTML = header
  modalBodyEl.innerHTML = body
  modalBodyEl.scrollTo(0, 0)
  modalBoxEl.classList.remove('md:max-w-lg', 'md:max-w-xl', 'md:max-w-2xl')
  switch (size) {
    case 'sm':
      modalBoxEl.classList.add('md:max-w-lg')
      break
    case 'md':
      modalBoxEl.classList.add('md:max-w-xl')
      break
    case 'lg':
      modalBoxEl.classList.add('md:max-w-4xl')
      break
    default:
      modalBoxEl.classList.add('md:max-w-lg')
  }
  showModal()
}
