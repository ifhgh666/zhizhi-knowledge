<script setup>
import { ref, computed, watch } from 'vue'
import { renderMarkdown, issueNewUrl } from '../data.js'

const props = defineProps({
  blog: { type: Object, required: true },
  params: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['navigate'])

const activeCat = ref('全部')
const searchKw = ref('')

const posts = computed(() => props.blog.posts ?? [])
const currentPost = computed(() => {
  if (!props.params?.id) return null
  return posts.value.find((p) => p.id === props.params.id) ?? null
})

const categories = computed(() => {
  const s = new Set(posts.value.map((p) => p.category).filter(Boolean))
  return ['全部', ...s]
})

const filtered = computed(() => {
  const kw = searchKw.value.trim().toLowerCase()
  return posts.value.filter((p) => {
    if (activeCat.value !== '全部' && p.category !== activeCat.value) return false
    if (kw) {
      const hay = `${p.title} ${p.summary} ${(p.tags ?? []).join(' ')} ${p.content ?? ''}`.toLowerCase()
      if (!hay.includes(kw)) return false
    }
    return true
  })
})

function openPost(id) {
  emit('navigate', 'posts', { id })
}

function backToList() {
  emit('navigate', 'posts')
}

watch(() => props.params?.cat, (c) => {
  if (c) activeCat.value = c
})
</script>

<template>
  <section class="page-sec">
    <!-- ============ 文章阅读视图 ============ -->
    <template v-if="currentPost">
      <div style="margin: 20px 0 14px">
        <button type="button" class="btn btn-sm" @click="backToList">
          ← 返回文章列表
        </button>
      </div>

      <article class="card article-card">
        <header class="article-head">
          <div class="article-meta">
            <span class="tag-pill tag-pill-green">{{ currentPost.category }}</span>
            <span v-for="t in currentPost.tags" :key="t" class="tag-pill">#{{ t }}</span>
            <span class="tiny muted" style="margin-left:auto">{{ currentPost.date }}</span>
          </div>
          <h1 class="article-title">{{ currentPost.title }}</h1>
          <p v-if="currentPost.summary" class="article-summary">{{ currentPost.summary }}</p>
        </header>

        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="article-content" v-html="renderMarkdown(currentPost.content)" />

        <footer v-if="currentPost.issueUrl" class="article-foot tiny muted">
          <a :href="currentPost.issueUrl" target="_blank" rel="noreferrer" class="sec-more">
            在 GitHub Issue 中查看或编辑本文 ↗
          </a>
        </footer>
      </article>
    </template>

    <!-- ============ 文章列表视图 ============ -->
    <template v-else>
      <div class="sec-head" style="margin-top:22px">
        <h1 class="sec-title" style="font-size:22px">学习与文章</h1>
        <a
          class="btn btn-primary btn-sm"
          :href="issueNewUrl(blog.profile?.repo, 'post.yml')"
          target="_blank"
          rel="noreferrer"
        >
          ＋ 写新文章
        </a>
      </div>
      <p class="muted small" style="margin:0 0 18px">
        记录后端开发、大模型与 Agent 学习过程中的思考、踩坑与总结。
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

        <input
          v-model="searchKw"
          class="search-box"
          type="search"
          placeholder="搜索标题、标签或内容…"
        />
      </div>

      <div v-if="filtered.length" class="card list-card">
        <div
          v-for="post in filtered"
          :key="post.id"
          class="article-row"
          @click="openPost(post.id)"
        >
          <div class="row-top">
            <span class="post-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="#46963f" stroke-width="1.7">
                <rect x="3.5" y="2.5" width="13" height="15" rx="2" />
                <line x1="6.5" y1="7" x2="13.5" y2="7" stroke-linecap="round" />
                <line x1="6.5" y1="10.5" x2="13.5" y2="10.5" stroke-linecap="round" />
                <line x1="6.5" y1="14" x2="10.5" y2="14" stroke-linecap="round" />
              </svg>
            </span>
            <h2 class="row-title">{{ post.title }}</h2>
            <span class="row-date tiny muted">{{ post.date }}</span>
          </div>
          <p class="row-summary">{{ post.summary }}</p>
          <div class="row-tags">
            <span class="tag-pill tag-pill-green">{{ post.category }}</span>
            <span v-for="t in post.tags" :key="t" class="tag-pill">#{{ t }}</span>
          </div>
        </div>
      </div>

      <div v-else class="card" style="padding:36px; text-align:center; color:var(--muted)">
        没有找到匹配的文章。
      </div>
    </template>
  </section>
</template>

<style scoped>
.search-box {
  width: 230px;
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 13.5px;
  outline: none;
}

.search-box:focus {
  border-color: var(--green);
}

.list-card {
  padding: 4px 20px;
}

.article-row {
  padding: 18px 4px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background 0.12s;
}

.article-row:last-child {
  border-bottom: none;
}

.row-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.post-icon {
  display: inline-flex;
  align-items: center;
  flex: none;
}

.row-title {
  margin: 0;
  font-size: 16.5px;
  font-weight: 700;
  color: var(--text);
  flex: 1;
}

.article-row:hover .row-title {
  color: var(--green-dark);
}

.row-date {
  flex: none;
  font-variant-numeric: tabular-nums;
}

.row-summary {
  margin: 0 0 10px 28px;
  font-size: 14px;
  color: var(--text-2);
}

.row-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-left: 28px;
}

/* ---------- 文章详情 ---------- */

.article-card {
  padding: 28px 34px;
}

.article-head {
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 22px;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.article-title {
  margin: 0 0 10px;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.35;
}

.article-summary {
  margin: 0;
  font-size: 14.5px;
  color: var(--muted);
}

.article-content :deep(h2) {
  font-size: 19px;
  margin: 24px 0 10px;
  color: var(--text);
}

.article-content :deep(h3) {
  font-size: 16.5px;
  margin: 18px 0 8px;
}

.article-content :deep(p) {
  margin: 0 0 14px;
  line-height: 1.8;
  color: var(--text-2);
}

.article-content :deep(ul),
.article-content :deep(ol) {
  margin: 0 0 16px;
  padding-left: 22px;
  color: var(--text-2);
  line-height: 1.8;
}

.article-content :deep(.md-pre) {
  margin: 14px 0;
  padding: 14px 16px;
  border-radius: 10px;
  background: #1f2922;
  color: #e9f3ea;
  overflow-x: auto;
  font-size: 13.5px;
  line-height: 1.6;
}

.article-content :deep(.md-inline-code) {
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--green-soft);
  color: var(--green-dark);
  font-size: 13.5px;
}

.article-content :deep(.md-img) {
  max-width: 100%;
  border-radius: 10px;
  margin: 10px 0;
}

.article-foot {
  margin-top: 24px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

@media (max-width: 680px) {
  .article-card { padding: 20px 18px; }
  .row-summary, .row-tags { margin-left: 0; }
}
</style>
