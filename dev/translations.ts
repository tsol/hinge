import type { ComputedRef } from 'vue'
import type { Locale } from './composables/useI18n'

export interface CardItem {
  title: string
  desc: string
}

export interface StepItem {
  badge: string
  label: string
}

export interface PageText {
  headerSub: string
  whatIsTitle: string
  whatIsDesc: string
  howTitle: string
  whyTitle: string
  tryTitle: string
  tryDesc: string
  footerDesc: string
  details: string
  items: StepItem[]
  cards: CardItem[]
}

const en: PageText = {
  headerSub:
    'A universal control panel for any coding agent. Point at an element, say what to change in words — and see the result in the browser instantly. Works from your phone, no context switching needed.',
  whatIsTitle: 'What is it',
  whatIsDesc:
    'Hinge is a bridge between you and any coding agent (Hermes, Claude Code, Replit Agent, OpenCode — whatever). Click the gear, pick an element on the page, describe what to change in plain words — the agent gets the context and applies the changes.',
  howTitle: 'How it works',
  whyTitle: 'Why use it',
  tryTitle: 'Try it',
  tryDesc: 'Open the panel → pick a component → write your task. Works on desktop and phone.',
  details: 'More',
  footerDesc:
    'Hinge is an open-source Vite Plugin that turns any coding agent into a controllable interface with element selection, file context, and live preview via HMR.',
  items: [
    { badge: '01', label: 'Point the gear at the element you want to change' },
    { badge: '02', label: 'Write in words: "make this card blue", "replace the image", "redesign all pages"' },
    { badge: '03', label: 'The agent gets the context, applies changes, HMR updates the page' },
    { badge: '04', label: 'See the result right away — on desktop or phone' },
  ],
  cards: [
    {
      title: '🎯 Point & Say',
      desc: 'Click the gear → pick any element on the page. Hinge highlights its bounds and identifies the component. Just say what to change — the agent will handle it.',
    },
    {
      title: '📱 Works from Phone',
      desc: 'Open the site on your phone — the panel is touch-friendly. No need to sit at a computer to code. Everything works the same as on desktop.',
    },
    {
      title: '⚡ Live HMR Preview',
      desc: 'The agent changes code → Vite HMR picks it up → you see results immediately. No switching between Telegram and the site, no blind waiting.',
    },
    {
      title: '🔌 Any Agent',
      desc: 'Plug in any coding agent: Hermes, Claude Code, Replit Agent, OpenCode — doesn\'t matter. Hinge is a universal control surface, not tied to one backend.',
    },
  ],
}

const ru: PageText = {
  headerSub:
    'Универсальная панель управления для любого coding agent. Ткни на элемент, скажи словами что изменить — и смотри результат сразу в браузере. Работает с телефона, не требует переключения контекста.',
  whatIsTitle: 'Что это',
  whatIsDesc:
    'Hinge — это прослойка между тобой и любым coding agent\'ом (Hermes, Claude Code, Replit Agent, OpenCode — любой). Ткни на шестерёнку, выбери элемент на странице, напиши словами что сделать — агент получит контекст и применит изменения.',
  howTitle: 'Как работает',
  whyTitle: 'Зачем это нужно',
  tryTitle: 'Попробовать',
  tryDesc: 'Открой панель → выбери компонент → напиши задачу. Всё работает и с телефона.',
  details: 'Подробнее',
  footerDesc:
    'Hinge — open-source Vite Plugin, который превращает любой coding agent в управляемый интерфейс с выбором элементов, файловым контекстом и live-превью через HMR.',
  items: [
    { badge: '01', label: 'Наведи шестерёнку на элемент, который хочешь изменить' },
    { badge: '02', label: 'Напиши словами: «сделай эту карточку синей», «замени картинку», «переделай все страницы»' },
    { badge: '03', label: 'Агент получает контекст, применяет изменения, HMR обновляет страницу' },
    { badge: '04', label: 'Смотри результат сразу — на десктопе или с телефона' },
  ],
  cards: [
    {
      title: '🎯 Тыкни и скажи',
      desc: 'Кликни на шестерёнку → выбери любой элемент на странице. Hinge подсветит границы и определит компонент. Напиши словами что менять — агент разберётся.',
    },
    {
      title: '📱 Работай с телефона',
      desc: 'Открой сайт на телефоне — панель адаптирована под touch. Не надо сидеть за компом, чтобы воркодить. Всё то же самое, что и на десктопе.',
    },
    {
      title: '⚡ HMR в реальном времени',
      desc: 'Агент меняет код → Vite HMR подхватывает → ты видишь результат сразу. Никаких переключений между Telegram и сайтом, никакого слепого ожидания.',
    },
    {
      title: '🔌 Любой агент',
      desc: 'Подключай любого coding agent: Hermes, Claude Code, Replit Agent, OpenCode — не важно. Hinge — это универсальный интерфейс управления, не привязанный к одному бэкенду.',
    },
  ],
}

const all: Record<Locale, PageText> = { en, ru }

export function t(locale: Locale | ComputedRef<Locale>): PageText {
  const l = typeof locale === 'object' ? locale.value : locale
  return all[l]
}
