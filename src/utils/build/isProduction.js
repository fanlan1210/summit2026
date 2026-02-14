export function isProduction() {
  return import.meta.env.BUILD_MODE === 'production'
}
