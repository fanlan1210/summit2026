export function isStaging() {
  return import.meta.env.BUILD_MODE === 'staging'
}
