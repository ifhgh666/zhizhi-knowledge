<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import PageHero from '../components/PageHero.vue'
import { dataApi, categoryLabel, formatDateOnly } from '../data.js'

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  indexData: { type: Object, default: null },
})
const emit = defineEmits(['navigate'])

const query = ref(props.params.q ?? '')
const scope = ref('all')
const loading = ref(true)
const error = ref('')

const models = ref([])
const topics = ref([])
const issues = ref([])

async function loadCorpus() {
  loading.value = true
  error.value = ''
  try {
    const idx = props.indexData ?? (await dataApi.index())
    const latestMonth = idx.rank?.months?.[0]
    const recentDates = (idx.v2ex?.dates ?? []).slice(0, 14)

    const [rankRes, periodRes, ...v2exRes] = await Promise.all([
      latestMonth ? dataApi.rankMonth(latestMonth).catch(() => null) : null,
      dataApi.periodical().catch(() => null),
      ...recentDates.map((d) => dataApi.v2exDay(d).catch(() => null)),
    ])

    const mList = []
    if (rankRes?.categories) {
      for (const [cat, arr] of Object.entries(rankRes.categories)) {
        for (const m of arr) {
          mList.push({ ...m, cat, month: rankRes.month })
        }
      }
    }
    models.value = mList

    const seenUrl = new Set()
    const tList = []
    for (const day of v2exRes) {
      if (!day) continue
      for (const it of day.items ?? []) {
        if (seenUrl.has(it.url)) continue
        seenUrl.add(it.url)
        tList.push({ ...it, date: day.date })
      }
    }
    topics.value = tList
    issues.value = periodRes?.items ?? []
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const kw = computed(() => query.value.trim().toLowerCase())

const hitModels = computed(() => {
  if (!kw.value) return []
  return models.value.filter((m) =>
    `${m.name} ${m.organization} ${m.license} ${categoryLabel(m.cat)}`.toLowerCase().includes(kw.value),
  )
})

const hitTopics = computed(() => {
  if (!kw.value) return []
  return topics.value.filter((t) =>
    `${t.title} ${t.node} ${t.author} ${t.excerpt ?? ''}`.toLowerCase().includes(kw.value),
  )
})

const hitIssues = computed(() => {
  if (!kw.value) return []
  return issues.value.filter((i) =>
    `${i.title} ${(i.categories ?? []).map((c) => c.name).join(' ')}`.toLowerCase().includes(kw.value),
  )
})

const totalHits = computed(() => hitModels.value.length + hitTopics.value.length + hitIssues.value.length)

watch(() => props.params.q, (next) => {
  if (typeof next === 'string') query.value = next
})

onMounted(() => loadCorpus())
</script>

<template>
  <section>
    <PageHero
      eyebrow="SEARCH · 站内检索"
      title="搜索知识库"
      subtitle="在最新的大模型榜单、近期 V2EX 热议与历期 HelloGitHub 开源月刊中搜索关键词。"
      stamp="搜"
    />

    <div class="card control-bar">
      <div class="seg-group">
        <button type="button" class="seg-btn" :class="{ 'seg-btn-active': scope === 'all' }" @click="scope = 'all'">
          全部 ({{ totalHits }})
        </button>
        <button type="button" class="seg-btn" :class="{ 'seg-btn-active': scope === 'rank' }" @click="scope = 'rank'">
          模型 ({{ hitModels.length }})
        </button>
        <button type="button" class="seg-btn" :class="{ 'seg-btn-active': scope === 'v2ex' }" @click="scope = 'v2ex'">
          热议 ({{ hitTopics.length }})
        </button>
        <button type="button" class="seg-btn" :class="{ 'seg-btn-active': scope === 'periodical' }" @click="scope = 'periodical'">
          月刊 ({{ hitIssues.length }})
        </button>
      </div>

      <input
        v-model="query"
        class="inline-search"
        type="search"
        placeholder="输入模型名、厂商、技术词，如 Claude / Rust / 人工智能…"
      />
    </div>

    <div v-if="loading" class="card empty-box">正在准备检索数据…</div>
    <div v-else-if="error" class="card empty-box">载入失败：{{ error }}</div>
    <div v-else-if="!kw" class="card empty-box">
      在上方或右上角输入关键词开始搜索，例如 <code>Gemini</code>、<code>Agent</code>、<code>Rust</code>。
    </div>
    <div v-else-if="!totalHits" class="card empty-box">没有找到与「{{ query }}」相关的内容。</div>

    <div v-else class="search-results">
      <section v-if="(scope === 'all' || scope === 'rank') && hitModels.length" class="card main-panel">
        <div class="panel-head">
          <h2 class="panel-title">大模型榜单匹配 ({{ hitModels.length }})</h2>
        </div>
        <ul class="res-list">
          <li v-for="m in hitModels" :key="`${m.cat}-${m.name}`" class="res-row">
            <button type="button" class="res-title-btn" @click="emit('navigate', 'rank', { month: m.month, cat: m.cat })">
              {{ m.name }}
            </button>
            <div class="tiny muted res-meta">
              <span class="pill pill-seal">{{ categoryLabel(m.cat) }} #{{ m.position }}</span>
              <span v-if="m.organization" class="pill">{{ m.organization }}</span>
              <span v-if="m.rating">评分 {{ m.rating }}</span>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="(scope === 'all' || scope === 'v2ex') && hitTopics.length" class="card main-panel">
        <div class="panel-head">
          <h2 class="panel-title">V2EX 热议匹配 ({{ hitTopics.length }})</h2>
        </div>
        <ul class="res-list">
          <li v-for="t in hitTopics" :key="t.url" class="res-row">
            <a class="res-title" :href="t.url" target="_blank" rel="noreferrer">{{ t.title }}</a>
            <div class="tiny muted res-meta">
              <span v-if="t.node" class="pill">{{ t.node }}</span>
              <span>{{ t.date }}</span>
              <span>· {{ t.replies }} 回复</span>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="(scope === 'all' || scope === 'periodical') && hitIssues.length" class="card main-panel">
        <div class="panel-head">
          <h2 class="panel-title">开源月刊匹配 ({{ hitIssues.length }})</h2>
        </div>
        <ul class="res-list">
          <li v-for="i in hitIssues" :key="i.url" class="res-row">
            <a class="res-title" :href="i.url" target="_blank" rel="noreferrer">{{ i.title }}</a>
            <div class="tiny muted res-meta">
              <span>{{ formatDateOnly(i.publishedAt) }}</span>
              <span v-for="c in (i.categories ?? []).slice(0, 5)" :key="c.name" class="pill">
                {{ c.name }} ({{ c.count }})
              </span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<style scoped>
.inline-search {
  width: 300px;
  max-width: 100%;
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: var(--bg);
  color: var(--text);
  font-size: 13.5px;
  outline: none;
}

.inline-search:focus {
  border-color: var(--seal);
  background: var(--surface);
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.res-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.res-row {
  padding: 14px 22px;
  border-bottom: 1px solid var(--line);
}

.res-row:last-child { border-bottom: none; }

.res-title, .res-title-btn {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.res-title-btn {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  text-align: left;
}

.res-title:hover, .res-title-btn:hover {
  color: var(--seal);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.res-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
}
</style>
