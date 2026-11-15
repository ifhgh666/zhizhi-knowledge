<script setup>
defineProps({
  project: { type: Object, required: true },
})
</script>

<template>
  <a
    class="card proj-card"
    :href="project.url"
    target="_blank"
    rel="noreferrer"
  >
    <!-- 左侧插画缩略图（完全复刻参考图里的蓝窗/绿叶清单两种插画块） -->
    <div class="proj-thumb" :class="project.coverKind === 'checklist' ? 'thumb-green' : 'thumb-blue'" aria-hidden="true">
      <!-- 样式一：浏览器窗口插画 -->
      <svg v-if="project.coverKind !== 'checklist'" viewBox="0 0 180 116" class="thumb-svg">
        <defs>
          <linearGradient id="winGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#dbeafe" />
            <stop offset="100%" stop-color="#eff6ff" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="180" height="116" rx="10" fill="url(#winGrad)" />
        <circle cx="24" cy="96" r="34" fill="#bfdbfe" opacity="0.45" />
        <rect x="22" y="18" width="136" height="82" rx="7" fill="#ffffff" stroke="#bfd7f6" stroke-width="1.2" />
        <path d="M22 25a7 7 0 0 1 7-7h122a7 7 0 0 1 7 7v7H22v-7z" fill="#5b8def" />
        <circle cx="31" cy="25" r="2.2" fill="#ffffff" opacity="0.9" />
        <circle cx="38" cy="25" r="2.2" fill="#ffffff" opacity="0.7" />
        <circle cx="45" cy="25" r="2.2" fill="#ffffff" opacity="0.5" />
        <!-- 窗口内头像块与文本条 -->
        <rect x="33" y="42" width="26" height="26" rx="5" fill="#dceafe" />
        <circle cx="46" cy="52" r="5" fill="#93bbf5" />
        <path d="M38 64c2-4 14-4 16 0" fill="#93bbf5" />
        <rect x="68" y="43" width="54" height="6" rx="3" fill="#93bbf5" />
        <rect x="68" y="54" width="76" height="5" rx="2.5" fill="#dbe7f9" />
        <rect x="68" y="63" width="64" height="5" rx="2.5" fill="#dbe7f9" />
        <rect x="33" y="77" width="44" height="10" rx="4" fill="#e6f0fd" />
        <rect x="83" y="77" width="44" height="10" rx="4" fill="#edf4fc" />
      </svg>

      <!-- 样式二：绿植与任务清单插画 -->
      <svg v-else viewBox="0 0 180 116" class="thumb-svg">
        <defs>
          <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#dcfce7" />
            <stop offset="100%" stop-color="#f0fdf4" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="180" height="116" rx="10" fill="url(#leafGrad)" />
        <!-- 左侧枝叶 -->
        <path d="M28 96 Q32 70 40 52" stroke="#4ca64c" stroke-width="2.2" fill="none" stroke-linecap="round" />
        <ellipse cx="26" cy="72" rx="9" ry="4.5" transform="rotate(-25 26 72)" fill="#6ec067" />
        <ellipse cx="40" cy="66" rx="8" ry="4" transform="rotate(25 40 66)" fill="#52a94c" />
        <ellipse cx="29" cy="58" rx="8" ry="4" transform="rotate(-20 29 58)" fill="#52a94c" />
        <ellipse cx="42" cy="52" rx="7" ry="3.8" transform="rotate(20 42 52)" fill="#76c86f" />
        <!-- 右侧清单面板 -->
        <rect x="54" y="18" width="106" height="84" rx="7" fill="#ffffff" stroke="#b9e3b9" stroke-width="1.2" />
        <path d="M54 25a7 7 0 0 1 7-7h92a7 7 0 0 1 7 7v7H54v-7z" fill="#63b45b" />
        <circle cx="63" cy="25" r="2" fill="#ffffff" opacity="0.85" />
        <circle cx="70" cy="25" r="2" fill="#ffffff" opacity="0.65" />
        <!-- 勾选行 -->
        <rect x="65" y="40" width="11" height="11" rx="2.5" fill="#dcfce7" stroke="#56ab4f" stroke-width="1.2" />
        <path d="M68 45.5l2.2 2.2 4-4.2" stroke="#3c8c36" stroke-width="1.6" fill="none" stroke-linecap="round" />
        <rect x="83" y="41" width="52" height="5" rx="2.5" fill="#bcd9bc" />
        <rect x="83" y="49" width="36" height="4" rx="2" fill="#e1efe1" />

        <rect x="65" y="59" width="11" height="11" rx="2.5" fill="#dcfce7" stroke="#56ab4f" stroke-width="1.2" />
        <path d="M68 64.5l2.2 2.2 4-4.2" stroke="#3c8c36" stroke-width="1.6" fill="none" stroke-linecap="round" />
        <rect x="83" y="60" width="58" height="5" rx="2.5" fill="#bcd9bc" />
        <rect x="83" y="68" width="42" height="4" rx="2" fill="#e1efe1" />

        <rect x="65" y="78" width="11" height="11" rx="2.5" fill="#f2f7f2" stroke="#b9d4b9" stroke-width="1.2" />
        <rect x="83" y="79" width="46" height="5" rx="2.5" fill="#d3e5d3" />
      </svg>
    </div>

    <div class="proj-body">
      <h3 class="proj-title">{{ project.title }}</h3>
      <p class="proj-desc">{{ project.description }}</p>
      <div class="proj-tags">
        <span
          v-for="(tag, idx) in project.tags"
          :key="tag"
          class="tag-pill"
          :class="{ 'tag-pill-green': idx === 0 }"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </a>
</template>

<style scoped>
.proj-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 16px;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.proj-card:hover {
  transform: translateY(-2px);
  border-color: #c6dfc5;
  box-shadow: 0 8px 22px rgba(44, 107, 39, 0.07);
}

.proj-thumb {
  width: 164px;
  height: 106px;
  flex: none;
  border-radius: 10px;
  overflow: hidden;
}

.thumb-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.proj-body {
  flex: 1;
  min-width: 0;
}

.proj-title {
  margin: 0 0 6px;
  font-size: 16.5px;
  font-weight: 700;
  color: var(--text);
}

.proj-desc {
  margin: 0 0 12px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.proj-tags {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

@media (max-width: 560px) {
  .proj-card {
    flex-direction: column;
    align-items: stretch;
  }
  .proj-thumb {
    width: 100%;
    height: 120px;
  }
}
</style>
