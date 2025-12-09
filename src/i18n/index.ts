import { createI18n } from 'vue-i18n'
import es from './locales/es-ES'
import en from './locales/en-US'

// Language key for localStorage
const LANGUAGE_KEY = 'escaleta-language'

// Get saved language or browser language
function getInitialLocale(): string {
  const savedLanguage = localStorage.getItem(LANGUAGE_KEY)
  if (savedLanguage) {
    return savedLanguage
  }
  
  // Get browser language
  const browserLang = navigator.language || (navigator as any).userLanguage
  
  // Map browser language to our supported locales
  if (browserLang.startsWith('es')) {
    return 'es-ES'
  }
  
  // Default to English
  return 'en-US'
}

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getInitialLocale(),
  fallbackLocale: 'en-US',
  messages: {
    'es-ES': es,
    'en-US': en
  }
})

// Save language preference when changed
export function setLanguage(locale: string) {
  i18n.global.locale.value = locale as 'es-ES' | 'en-US'
  localStorage.setItem(LANGUAGE_KEY, locale)
}

export default i18n
