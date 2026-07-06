<template>
  <section class="dev-info">
    <p class="dev-info__desc">{{ text }}</p>
    <div class="dev-info__footnote">
      <a href="https://github.com/tsol/hinge" target="_blank" class="dev-info__link">GitHub →</a>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<style scoped>
.dev-info {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px 20px;
  font-size: 13px;
  margin-bottom: 40px;
}
.dev-info__desc {
  color: #8b949e;
  line-height: 1.7;
  font-size: 13px;
}
.dev-info__footnote {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #21262d;
  font-size: 13px;
}
.dev-info__link {
  color: #58a6ff;
  text-decoration: none;
  font-weight: 500;
}
.dev-info__link:hover {
  text-decoration: underline;
}
</style>
