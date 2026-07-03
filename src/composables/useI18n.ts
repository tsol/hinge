import { ref, computed } from 'vue'
import { en } from '../locales/en'
import { ru } from '../locales/ru'
import type { LocaleMessages } from '../locales/en'

const STORAGE_KEY = 'hinge-locale'

type LocaleId = 'en' | 'ru'

const locales: Record<LocaleId, LocaleMessages> = { en, ru }

function loadLocale(): LocaleId {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'ru') return saved
  return 'en'
}

const localeId = ref<LocaleId>(loadLocale())

export function useI18n() {
  const t = computed(() => locales[localeId.value])

  function setLocale(id: LocaleId) {
    localeId.value = id
    localStorage.setItem(STORAGE_KEY, id)
  }

  const currentLocale = computed(() => localeId.value)

  return { t, setLocale, currentLocale, locales: ['en', 'ru'] as LocaleId[] }
}
