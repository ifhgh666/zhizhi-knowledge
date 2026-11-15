<script setup>
defineProps({
  eyebrow: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  stamp: { type: String, default: '知' },
})
</script>

<template>
  <header class="hero">
    <div class="hero-main">
      <div class="eyebrow">
        <span class="eyebrow-line" />
        <span>{{ eyebrow }}</span>
      </div>
      <h1 class="hero-title serif">{{ title }}</h1>
      <p v-if="subtitle" class="hero-sub">{{ subtitle }}</p>
    </div>

    <div class="seal-wrap" aria-hidden="true">
      <div class="seal-box">
        <div class="seal-inner serif">{{ stamp }}</div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 0 24px;
}

.hero-main {
  min-width: 0;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 8px;
}

.eyebrow-line {
  display: inline-block;
  width: 22px;
  height: 1.5px;
  background: var(--seal);
}

.hero-title {
  margin: 0 0 8px;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.02em;
  color: var(--text);
}

.hero-sub {
  margin: 0;
  font-size: 14.5px;
  color: var(--text-2);
  max-width: 680px;
}

/* 右侧红色方章（参考图片里的倾斜"日"字印章） */
.seal-wrap {
  flex: none;
  padding-right: 6px;
}

.seal-box {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  background: var(--seal);
  padding: 5px;
  transform: rotate(7deg);
  box-shadow: 0 6px 16px rgba(184, 50, 42, 0.22);
}

.seal-inner {
  width: 100%;
  height: 100%;
  border: 1.5px solid rgba(255, 248, 240, 0.55);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff8f0;
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

@media (max-width: 640px) {
  .hero { padding: 8px 0 18px; gap: 14px; }
  .hero-title { font-size: 28px; }
  .seal-box { width: 54px; height: 54px; }
  .seal-inner { font-size: 24px; }
}
</style>
