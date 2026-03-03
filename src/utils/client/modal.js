const modalEl = document.querySelector('#modal')
const modalHeaderEl = document.querySelector('#modal .modal-header')
const modalBodyEl = document.querySelector('#modal .modal-body')

export function showModal() {
  modalEl.classList.add('show')
}

export function hideModal() {
  modalEl.classList.remove('show')
}

export function showModalWith({ header, body }) {
  modalHeaderEl.innerHTML = header
  modalBodyEl.innerHTML = body
  showModal()
}
