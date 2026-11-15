<script setup>
import { ref, computed, onMounted } from 'vue'
import PageHero from '../components/PageHero.vue'
import { dataApi, formatDateOnly, formatTime } from '../data.js'

const data = ref(null)
const loading = ref(true)
const error = ref('')
const activeYear = ref('全部')
const activeCat = ref('')
const showCount = ref(30)

const allItems = computed(() => data.value?.items ?? [])

const years = computed(() => {
  const s = new Set()
  for (const it of allItems.value) {
    const y = it.publishedAt ? formatDateOnly(it.publishedAt).slice(0, 4) : ''
    if (/^\d{4}$/.test(y)) s.add(y)
  }
  return ['全部', ...[...s].sort().reverse()]
})

const catStats = computed(() => {
  const counts = new Map()
  for (const it of allItems.value) {
    for (const c of it.categories ?? []) {
      counts.set(c.name, (counts.get(c.name) ?? 0) + c.count)
    }
  }
  const rows = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  const max = rows[0]?.count ?? 1
  return rows.map((r) => ({ ...r, pct: Math.round((r.count / max) * 100) }))
})

const filtered = computed(() => {
  return allItems.value.filter((it) => {
    if (activeYear.value !== '全部') {
      const y = it.publishedAt ? formatDateOnly(it.publishedAt).slice(0, 4) : ''
      if (y !== activeYear.value) return false
    }
    if (activeCat.value) {
      if (!(it.categories ?? []).some((c) => c.name === activeCat.value)) return false
    }
    return true
  })
})

const visibleItems = computed(() => filtered.value.slice(0, showCount.value))
const totalProjects = computed(() => allItems.value.reduce((s, it) => s + (it.total ?? 0), 0))

function toggleCat(name) {
  activeCat.value = activeCat.value === name ? '' : name
  showCount.value = 30
}

function setYear(y) {
  activeYear.value = y
  showCount.value = 30
}

onMounted(async () => {
  try {
    data.value = await dataApi.periodical()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section>
    <PageHero
      eyebrow="PERIODICAL · 数据源自 HelloGitHub 月刊"
      title="开源月刊"
      subtitle="每月 28 日发布，整理 GitHub 上有趣、入门级、可直接上手的开源项目。"
      stamp="刊"
    />

    <div class="card control-bar">
      <div class="seg-group">
        <button
          v-for="y in years.slice(0, 7)"
          :key="y"
          type="button"
          class="seg-btn"
          :class="{ 'seg-btn-active': activeYear === y }"
          @click="setYear(y)"
        >
          {{ y === '全部' ? '全部年份' : `${y} 年` }}
        </button>
      </div>

      <div class="pager">
        <span v-if="activeCat" class="pill pill-seal">
          分类：{{ activeCat }}
          <button type="button" class="clear-x" aria-label="清除分类" @click="activeCat = ''">×</button>
        </span>
        <button
          v-if="activeYear !== '全部' || activeCat"
          type="button"
          class="btn btn-seal-soft"
          @click="activeYear = '全部'; activeCat = ''"
        >
          重置筛选
        </button>
      </div>
    </div>

    <p v-if="!loading && !error" class="summary-strip">
      <span>共收录</span> <strong>{{ allItems.length }}</strong> <span>期月刊</span>
      <span>·</span>
      <span>累计介绍</span> <strong>{{ totalProjects.toLocaleString() }}</strong> <span>个开源项目</span>
      <span>·</span>
      <span>当前显示</span> <strong>{{ filtered.length }}</strong> <span>期</span>
    </p>

    <div v-if="loading" class="card empty-box">正在载入月刊目录…</div>
    <div v-else-if="error" class="card empty-box">载入失败：{{ error }}</div>

    <div v-else class="two-col">
      <div class="card main-panel">
        <div class="panel-head">
          <h2 class="panel-title">月刊目录 · {{ filtered.length }} 期</h2>
          <span class="tiny muted">点击每期标题前往 HelloGitHub 阅读</span>
        </div>

        <ul v-if="visibleItems.length" class="issue-list">
          <li v-for="it in visibleItems" :key="it.url" class="issue-row">
            <div class="vol-square serif">{{ it.volume ?? '—' }}</div>
            <div class="issue-body">
              <div class="issue-head">
                <h3 class="issue-title">
                  <a :href="it.url" target="_blank" rel="noreferrer">{{ it.title }}</a>
                </h3>
                <span class="tiny muted">{{ formatDateOnly(it.publishedAt) }}</span>
              </div>
              <div class="issue-cats">
                <span v-if="it.total" class="pill pill-seal">共 {{ it.total }} 个项目</span>
                <button
                  v-for="c in it.categories"
                  :key="c.name"
                  type="button"
                  class="pill cat-pill"
                  :class="{ 'pill-seal': activeCat === c.name }"
                  @click="toggleCat(c.name)"
                >
                  {{ c.name }} ({{ c.count }})
                </button>
              </div>
            </div>
          </li>
        </ul>
        <div v-else class="empty-box">没有符合条件的月刊。</div>

        <div v-if="filtered.length > visibleItems.length" class="load-more">
          <button type="button" class="btn btn-seal-soft" @click="showCount += 30">
            加载更多（还有 {{ filtered.length - visibleItems.length }} 期）
          </button>
        </div>
      </div>

      <aside class="side-col">
        <div class="card side-card">
          <h3 class="side-title">月刊概览</h3>
          <div class="kv-list">
            <div class="kv-row">
              <span class="muted">最新一期</span>
              <span class="kv-val">{{ allItems[0]?.volume ? `第 ${allItems[0].volume} 期` : '—' }}</span>
            </div>
            <div class="kv-row">
              <span class="muted">发布日期</span>
              <span class="kv-val">{{ formatDateOnly(allItems[0]?.publishedAt) }}</span>
            </div>
            <div class="kv-row">
              <span class="muted">收录总期数</span>
              <span class="kv-val">{{ allItems.length }}</span>
            </div>
            <div class="kv-row">
              <span class="muted">同步时间</span>
              <span class="kv-val tiny">{{ formatTime(data?.fetchedAt) }}</span>
            </div>
          </div>
        </div>

        <div v-if="catStats.length" class="card side-card">
          <h3 class="side-title">热门分类（点击筛选）</h3>
          <div class="bar-list">
            <button
              v-for="c in catStats.slice(0, 10)"
              :key="c.name"
              type="button"
              class="bar-item bar-btn"
              @click="toggleCat(c.name)"
            >
              <div class="bar-head">
                <span :style="{ color: activeCat === c.name ? 'var(--seal)' : 'inherit', fontWeight: activeCat === c.name ? 650 : 400 }">
                  {{ c.name }}
                </span>
                <span class="muted">{{ c.count }} 个项目</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${c.pct}%` }" />
              </div>
            </button>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.issue-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.issue-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 22px;
  border-bottom: 1px solid var(--line);
  transition: background 0.12s;
}

.issue-row:last-child { border-bottom: none; }
.issue-row:hover { background: #fdfbf7; }

.vol-square {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 10px;
  background: var(--seal-soft);
  border: 1px solid var(--seal-line);
  color: var(--seal);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.issue-body {
  flex: 1;
  min-width: 0;
}

.issue-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.issue-title {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
}

.issue-title a:hover {
  color: var(--seal);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.issue-cats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.cat-pill {
  cursor: pointer;
}

.cat-pill:hover {
  border-color: var(--seal-line);
  color: var(--seal);
}

.clear-x {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0 0 0 2px;
  font-size: 14px;
  line-height: 1;
}

.load-more {
  padding: 16px 22px;
  border-top: 1px solid var(--line);
  text-align: center;
}

.bar-btn {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  cursor: pointer;
}

@media (max-width: 640px) {
  .issue-row { padding: 14px 16px; gap: 12px; }
}
</style>
