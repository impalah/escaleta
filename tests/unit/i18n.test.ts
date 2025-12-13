import { describe, it, expect, beforeEach, vi } from 'vitest'
import i18n, { setLanguage } from '@/i18n/index'

describe('i18n', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('i18n instance', () => {
    it('should be created with correct configuration', () => {
      expect(i18n.global.availableLocales).toContain('es-ES')
      expect(i18n.global.availableLocales).toContain('en-US')
      expect(i18n.global.fallbackLocale.value).toBe('en-US')
    })

    it('should have messages for both locales', () => {
      expect(i18n.global.getLocaleMessage('es-ES')).toBeDefined()
      expect(i18n.global.getLocaleMessage('en-US')).toBeDefined()
    })
  })

  describe('setLanguage', () => {
    it('should change locale to Spanish', () => {
      setLanguage('es-ES')
      
      expect(i18n.global.locale.value).toBe('es-ES')
      expect(localStorage.getItem('escaleta-language')).toBe('es-ES')
    })

    it('should change locale to English', () => {
      setLanguage('en-US')
      
      expect(i18n.global.locale.value).toBe('en-US')
      expect(localStorage.getItem('escaleta-language')).toBe('en-US')
    })

    it('should persist language preference', () => {
      setLanguage('es-ES')
      
      const saved = localStorage.getItem('escaleta-language')
      expect(saved).toBe('es-ES')
    })
  })

  describe('locale availability', () => {
    it('should have Spanish locale available', () => {
      expect(i18n.global.availableLocales).toContain('es-ES')
    })

    it('should have English locale available', () => {
      expect(i18n.global.availableLocales).toContain('en-US')
    })

    it('should default to English fallback', () => {
      expect(i18n.global.fallbackLocale.value).toBe('en-US')
    })
  })
})
