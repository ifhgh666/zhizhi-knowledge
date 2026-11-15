<script setup>
import { ref, computed } from 'vue'
import { issueNewUrl } from '../data.js'

const props = defineProps({
  blog: { type: Object, required: true },
})

const activeCat = ref('全部')
const list = computed(() => props.blog.recommends ?? [])

const categories = computed(() => {
  const s = new Set(list.value.map((r) => r.category).filter(Boolean))
  return ['全部', ...s]
})

const filtered = computed(() => {
  if (activeCat.value === '全部') return list.value
  return list.value.filter((r) => r.category === activeCat.value)
})
</script>

<template>
  <section class="page-sec">
    <div class="sec-head" style="margin-top:22px">
      <h1 class="sec-title" style="font-size:22px">推荐与收藏</h1>
      <a
        class="btn btn-primary btn-sm"
        :href="issueNewUrl(blog.profile?.repo, 'recommend.yml')"
        target="_blank"
        rel="noreferrer"
      >
        ＋ 添加推荐
      </a>
    </div>
    <p class="muted small" style="margin:0 0 18px">
      平时学习后端与大模型时遇到的优质教程、开源项目与实用工具合集。
    </p>

    <div class="filter-bar">
      <div class="filter-pills">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          class="filter-pill"
          :class="{ 'filter-pill-active': activeCat === cat }"
          @click="activeCat = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <div class="rec-list">
      <a
        v-for="item in filtered"
        :key="item.id"
        class="rec-item"
        :href="item.url"
        target="_blank"
        rel="noreferrer"
      >
        <div class="rec-left">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#46963f" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke-linejoin="round" />
          </svg>
          <span>{{ item.category || '推荐' }}</span>
        </div>

        <div class="rec-body">
          <strong class="rec-name">{{ item.title }}</strong>
          <p class="rec-summary">{{ item.summary }}</p>
        </div>

        <span class="rec-link-icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="#46963f" stroke-width="1.8">
            <path d="M11 3h6v6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M17 3L9.5 10.5" stroke-linecap="round" />
            <path d="M15 11.5v4a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 15.5v-9A1.5 1.5 0 0 1 4.5 5h4" stroke-linecap="round" />
          </svg>
        </span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.rec-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rec-item {
  padding: 18px 22px;
  border-radius: var(--radius);
  background: var(--green-banner);
  border: 1px solid #d8ecd6;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: background 0.15s, border-color 0.15s, transform 0.15s;
}

.rec-item:hover {
  background: #e4f2e2;
  border-color: #bfe0bc;
  transform: translateY(-1px);
}

.rec-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  padding-right: 18px;
  border-right: 1px solid #cfe4cd;
  min-width: 96px;
  flex: none;
}

.rec-body {
  flex: 1;
  min-width: 0;
}

.rec-name {
  display: block;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 3px;
}

.rec-summary {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-2);
}

.rec-link-icon {
  flex: none;
  display: inline-flex;
}

@media (max-width: 640px) {
  .rec-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .rec-left {
    border-right: none;
    padding-right: 0;
  }
}
</style>
