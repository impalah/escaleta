import i18n from '@/i18n'

/**
 * Helper to get translations outside component context
 */
export function t(key: string, params?: Record<string, any>): string {
  const { t } = i18n.global
  return t(key, params)
}

export function getBeatTypeName(typeId: string): string {
  const key = `beatTypes.${typeId}`
  return t(key)
}

export function getNewBeatTitle(typeId: string): string {
  const typeName = getBeatTypeName(typeId)
  return t('examples.newBeat', { type: typeName })
}
