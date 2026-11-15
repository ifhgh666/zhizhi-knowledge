<script setup>
import { ref, computed } from 'vue'
import { renderMarkdown, issueNewUrl } from '../data.js'

const props = defineProps({
  blog: { type: Object, required: true },
})

const activeTag = ref('全部')
const moments = computed(() => props.blog.moments ?? [])

const tags = computed(() => {
  const s = new Set(moments.value.map((m) => m.tag).filter(Boolean))
  return ['全部', ...s]
})

const filtered = computed(() => {
  if (activeTag.value === '全部') return moments.value
  return moments.value.filter((m) => m.tag === activeTag.value)
})
</script>

<template>
  <section class="page-sec">
    <div class="sec-head" style="margin-top:22px">
      <h1 class="sec-title" style="font-size:22px">随笔与动态</h1>
      <a
        class="btn btn-primary btn-sm"
        :href="issueNewUrl(blog.profile?.repo, 'moment.yml')"
        target="_blank"
        rel="noreferrer"
      >
        ＋ 发一条随笔
      </a>
    </div>
    <p class="muted small" style="margin:0 0 18px">
      不用写成完整长文的零碎想法、今日所学、跑步听歌或游戏日常。
    </p>

    <div class="filter-bar">
      <div class="filter-pills">
        <button
          v-for="t in tags"
          :key="t"
          type="button"
          class="filter-pill"
          :class="{ 'filter-pill-active': activeTag === t }"
          @click="activeTag = t"
        >
          {{ t }}
        </button>
      </div>
    </div>

    <div class="timeline">
      <article v-for="m in filtered" :key="m.id" class="card moment-item">
        <div class="moment-head">
          <img class="mini-avatar" :src="'./avatar.jpg'" alt="if" />
          <strong>{{ blog.profile?.name || 'if' }}</strong>
          <span class="tag-pill tag-pill-green">{{ m.tag }}</span>
          <span class="tiny muted" style="margin-left:auto">{{ m.date }}</span>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="moment-body" v-html="renderMarkdown(m.content)" />
      </article>
    </div>
  </section>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.moment-item {
  padding: 18px 22px;
}

.moment-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.mini-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.moment-body :deep(p) {
  margin: 0;
  color: var(--text-2);
  font-size: 14.5px;
  line-height: 1.75;
}

.moment-body :deep(.md-img) {
  max-width: 100%;
  max-height: 320px;
  border-radius: 10px;
  margin-top: 10px;
}
</style>
