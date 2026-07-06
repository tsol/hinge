import { ref } from 'vue'

export type Locale = 'en' | 'ru'

const locale = ref<Locale>('en')

export function useI18n() {
  function setLocale(l: Locale) {
    locale.value = l
  }
  return { locale, setLocale }
}
