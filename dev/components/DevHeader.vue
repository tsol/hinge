<template>
  <header class="dev-header">
    <div class="dev-header__top">
      <span class="dev-header__logo">⚙</span>
      <h1>Hinge</h1>
    </div>
    <p class="dev-sub">
      AI-ассистент для Vite-проектов. Расширяй возможности разработки —
      выбирай компоненты, прикрепляй файлы, отправляй задачи Hermes Agent
      — не выходя из браузера.
    </p>
    <div class="dev-badges">
      <span class="dev-badge-tag">⚡ Vite Plugin</span>
      <span class="dev-badge-tag">🧠 Hermes Agent</span>
      <span class="dev-badge-tag">📦 Open Source</span>
    </div>
  </header>
</template>

<style scoped>
.dev-header {
  margin-bottom: 36px;
  text-align: center;
}
.dev-header__top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}
.dev-header__logo {
  font-size: 32px;
  line-height: 1;
}
.dev-header h1 {
  font-size: 32px;
  color: #f0f6fc;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.dev-sub {
  color: #8b949e;
  font-size: 14px;
  line-height: 1.6;
  max-width: 520px;
  margin: 0 auto;
}
.dev-badges {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 14px;
  flex-wrap: wrap;
}
.dev-badge-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  background: #1c2333;
  color: #58a6ff;
  border: 1px solid rgba(88, 166, 255, 0.2);
}
</style>
