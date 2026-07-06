<template>
  <div class="dev-page">
    <DevHeader />

    <section class="dev-section">
      <h2 class="dev-section-title">{{ text.whatIsTitle }}</h2>
      <p class="dev-section-desc">{{ text.whatIsDesc }}</p>
    </section>

    <section class="dev-section">
      <h2 class="dev-section-title">{{ text.howTitle }}</h2>
      <DevList :items="text.items" />
    </section>

    <section class="dev-section">
      <h2 class="dev-section-title">{{ text.whyTitle }}</h2>
      <DevCardGrid :cards="text.cards" />
    </section>

    <DevFooter :text="text.footerDesc" />

    <section class="dev-section">
      <h2 class="dev-section-title">{{ text.tryTitle }}</h2>
      <p class="dev-section-desc">{{ text.tryDesc }}</p>
    </section>

    <Hinge />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Hinge from '../src/Hinge.vue'
import DevHeader from './components/DevHeader.vue'
import DevCardGrid from './components/DevCardGrid.vue'
import DevList from './components/DevList.vue'
import DevFooter from './components/DevFooter.vue'
import ToastContainer from '../src/components/ToastContainer.vue'
import { useI18n } from './composables/useI18n'
import { t } from './translations'

const { locale } = useI18n()
const text = computed(() => t(locale))
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0d1117;
  color: #c9d1d9;
  min-height: 100vh;
}
.dev-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 24px;
}
.dev-section {
  margin-bottom: 40px;
}
.dev-section-title {
  font-size: 18px;
  font-weight: 600;
  color: #f0f6fc;
  margin-bottom: 6px;
}
.dev-section-desc {
  font-size: 14px;
  color: #8b949e;
  line-height: 1.7;
  max-width: 640px;
}
</style>
