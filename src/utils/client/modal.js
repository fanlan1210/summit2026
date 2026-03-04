const modalEl = document.querySelector('#modal')
const modalHeaderEl = document.querySelector('#modal .modal-header')
const modalBodyEl = document.querySelector('#modal .modal-body')

export function showModal() {
  modalEl.classList.add('show')
  document.body.classList.add('overflow-hidden')
}

export function hideModal() {
  modalEl.classList.remove('show')
  document.body.classList.remove('overflow-hidden')
}

export function showModalWith({ header, body }) {
  modalHeaderEl.innerHTML = header
  modalBodyEl.innerHTML = body
  modalBodyEl.scrollTo(0, 0)
  showModal()
}
