export function extractHHmm(isoLike) {
  const m = isoLike.match(/T(\d{2}:\d{2})/)
  return m ? m[1] : '00:00'
}
