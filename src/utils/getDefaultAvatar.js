const stools = [
  `${import.meta.env.BASE_URL}/img/banner/g0v_stool-nbg-b-s.svg`,
  `${import.meta.env.BASE_URL}/img/banner/g0v_stool-nbg-g-m.svg`,
  `${import.meta.env.BASE_URL}/img/banner/g0v_stool-nbg-r-l.svg`,
  `${import.meta.env.BASE_URL}/img/banner/g0v_stool-nbg-y-s.svg`,
]

export function getDefaultAvatar(name) {
  return stools[stringToNumber(name, 0, stools.length - 1)]
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
