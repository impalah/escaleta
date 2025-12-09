import i18n from '@/i18n'

/**
 * Helper to get translations outside component context
 */
export function t(key: string, params?: Record<string, unknown>): string {
  const { t: translate } = i18n.global
  return translate(key, params || {})
}

export function getBeatTypeName(typeId: string): string {
  const key = `beatTypes.${typeId}`
  return t(key)
}

export function getNewBeatTitle(typeId: string): string {
  const typeName = getBeatTypeName(typeId)
  return t('examples.newBeat', { type: typeName })
}
