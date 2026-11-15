<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import PageHero from '../components/PageHero.vue'
import { dataApi, formatTime } from '../data.js'

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  indexData: { type: Object, default: null },
})
const emit = defineEmits(['navigate'])

const dates = ref([])
const activeDate = ref('')
const activeNode = ref('全部')
const dayData = ref(null)
const prevReplies = ref(null)
const loading = ref(true)
const error = ref('')

const rawItems = computed(() => dayData.value?.items ?? [])
const dateIdx = computed(() => dates.value.indexOf(activeDate.value))
const isLatest = computed(() => dateIdx.value === 0)

const nodeList = computed(() => {
  const counts = new Map()
  for (const it of rawItems.value) {
    const n = it.node || '未分类'
    counts.set(n, (counts.get(n) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const items = computed(() => {
  if (activeNode.value === '全部') return rawItems.value
  return rawItems.value.filter((it) => (it.node || '未分类') === activeNode.value)
})

const totalReplies = computed(() => rawItems.value.reduce((s, it) => s + (it.replies ?? 0), 0))
const replyDiffPct = computed(() => {
  if (!prevReplies.value || prevReplies.value <= 0) return null
  return Math.round(((totalReplies.value - prevReplies.value) / prevReplies.value) * 100)
})

const nodeBars = computed(() => {
  const max = nodeList.value[0]?.count ?? 1
  return nodeList.value.slice(0, 6).map((n) => ({ ...n, pct: Math.round((n.count / max) * 100) }))
})

async function loadDate(d) {
  if (!d) return
  loading.value = true
  error.value = ''
  activeNode.value = '全部'
  try {
    dayData.value = await dataApi.v2exDay(d)
    const idx = dates.value.indexOf(d)
    const prevDate = idx >= 0 ? dates.value[idx + 1] : null
    if (prevDate) {
      const prev = await dataApi.v2exDay(prevDate).catch(() => null)
      prevReplies.value = prev ? (prev.items ?? []).reduce((s, x) => s + (x.replies ?? 0), 0) : null
    } else {
      prevReplies.value = null
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function setDate(d) {
  if (!d || d === activeDate.value) return
  activeDate.value = d
  emit('navigate', 'v2ex', { date: d })
  void loadDate(d)
}

function shiftDate(delta) {
  const next = dates.value[dateIdx.value - delta]
  if (next) setDate(next)
}

onMounted(async () => {
  try {
    const idx = props.indexData ?? (await dataApi.index())
    dates.value = idx.v2ex?.dates ?? []
    const req = props.params.date
    activeDate.value = dates.value.includes(req) ? req : (dates.value[0] ?? '')
    if (activeDate.value) await loadDate(activeDate.value)
    else loading.value = false
  } catch (err) {
    error.value = err.message
    loading.value = false
  }
})

watch(() => props.params.date, (next) => {
  if (next && dates.value.includes(next) && next !== activeDate.value) {
    activeDate.value = next
    void loadDate(next)
  }
})
</script>

<template>
  <section>
    <PageHero
      eyebrow="HOT TOPICS · 数据源自 V2EX"
      title="V2EX 热议"
      subtitle="每天留存一份 V2EX 热门讨论快照，看看开发者们今天在聊什么。"
      stamp="热"
    />

    <!-- 控件栏：节点筛选 + 日期翻页 -->
    <div class="card control-bar">
      <div class="seg-group">
        <button
          type="button"
          class="seg-btn"
          :class="{ 'seg-btn-active': activeNode === '全部' }"
          @click="activeNode = '全部'"
        >
          全部 ({{ rawItems.length }})
        </button>
        <button
          v-for="n in nodeList.slice(0, 5)"
          :key="n.name"
          type="button"
          class="seg-btn"
          :class="{ 'seg-btn-active': activeNode === n.name }"
          @click="activeNode = activeNode === n.name ? '全部' : n.name"
        >
          {{ n.name }} ({{ n.count }})
        </button>
      </div>

      <div class="pager">
        <button
          type="button"
          class="btn pager-circle"
          title="前一天"
          :disabled="dateIdx < 0 || dateIdx >= dates.length - 1"
          @click="shiftDate(-1)"
        >
          ‹
        </button>
        <span class="pager-current">{{ activeDate || '—' }}</span>
        <button
          type="button"
          class="btn pager-circle"
          title="后一天"
          :disabled="dateIdx <= 0"
          @click="shiftDate(1)"
        >
          ›
        </button>
        <button
          type="button"
          class="btn btn-seal-soft"
          :disabled="isLatest || !dates.length"
          @click="setDate(dates[0])"
        >
          回到本期
        </button>
      </div>
    </div>

    <p v-if="!loading && !error && rawItems.length" class="summary-strip">
      <span>本期</span> <strong>{{ rawItems.length }}</strong> <span>条热门讨论</span>
      <span>·</span>
      <span>共</span> <strong>{{ totalReplies.toLocaleString() }}</strong> <span>条回复</span>
      <template v-if="replyDiffPct !== null">
        <span>·</span>
        <span>
          较上期
          <strong :style="{ color: replyDiffPct >= 0 ? 'var(--ok)' : 'var(--seal)' }">
            {{ replyDiffPct >= 0 ? `↑${replyDiffPct}%` : `↓${Math.abs(replyDiffPct)}%` }}
          </strong>
        </span>
      </template>
    </p>

    <div v-if="loading" class="card empty-box">正在载入热议…</div>
    <div v-else-if="error" class="card empty-box">载入失败：{{ error }}</div>

    <div v-else class="two-col">
      <div class="card main-panel">
        <div class="panel-head">
          <h2 class="panel-title">
            {{ activeNode === '全部' ? `热议榜 · ${items.length} 条` : `${activeNode} · ${items.length} 条` }}
          </h2>
          <span class="tiny muted">统计日期 {{ activeDate || '—' }}</span>
        </div>

        <ul v-if="items.length" class="topic-list">
          <li v-for="(item, idx) in items" :key="item.url" class="topic-row">
            <span class="rank-num" :class="`top-${idx + 1}`">{{ String(idx + 1).padStart(2, '0') }}</span>
            <div class="topic-body">
              <h3 class="topic-title">
                <a :href="item.url" target="_blank" rel="noreferrer">{{ item.title }}</a>
              </h3>
              <p v-if="item.excerpt" class="topic-excerpt small">{{ item.excerpt }}</p>
              <div class="topic-meta tiny muted">
                <span v-if="item.node" class="pill">{{ item.node }}</span>
                <span v-if="item.author">@{{ item.author }}</span>
                <span v-if="item.created">· 发布于 {{ formatTime(item.created) }}</span>
              </div>
            </div>
            <div class="topic-replies">
              <div class="reply-num">{{ item.replies }}</div>
              <div class="tiny muted">回复</div>
            </div>
          </li>
        </ul>
        <div v-else class="empty-box">当天没有热议记录。</div>
      </div>

      <aside class="side-col">
        <div class="card side-card">
          <h3 class="side-title">本期概览</h3>
          <div class="kv-list">
            <div class="kv-row">
              <span class="muted">热门话题</span>
              <span class="kv-val">{{ rawItems.length }}</span>
            </div>
            <div class="kv-row">
              <span class="muted">总回复数</span>
              <span class="kv-val">{{ totalReplies.toLocaleString() }}</span>
            </div>
            <div class="kv-row">
              <span class="muted">涉及节点</span>
              <span class="kv-val">{{ nodeList.length }}</span>
            </div>
            <div class="kv-row">
              <span class="muted">抓取时间</span>
              <span class="kv-val tiny">{{ formatTime(dayData?.fetchedAt) }}</span>
            </div>
          </div>
        </div>

        <div v-if="nodeBars.length" class="card side-card">
          <h3 class="side-title">节点分布</h3>
          <div class="bar-list">
            <div v-for="n in nodeBars" :key="n.name" class="bar-item">
              <div class="bar-head">
                <span>{{ n.name }}</span>
                <span class="muted">{{ n.count }} 条</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${n.pct}%` }" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="dates.length > 1" class="card side-card">
          <h3 class="side-title">历史归档 ({{ dates.length }} 天)</h3>
          <div class="archive-pills">
            <button
              v-for="d in dates.slice(0, 18)"
              :key="d"
              type="button"
              class="date-chip tiny"
              :class="{ 'date-chip-on': d === activeDate }"
              @click="setDate(d)"
            >
              {{ d }}
            </button>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.topic-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.topic-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 22px;
  border-bottom: 1px solid var(--line);
  transition: background 0.12s;
}

.topic-row:last-child { border-bottom: none; }
.topic-row:hover { background: #fdfbf7; }

.topic-body {
  flex: 1;
  min-width: 0;
}

.topic-title {
  margin: 0 0 6px;
  font-size: 15.5px;
  font-weight: 620;
  line-height: 1.45;
}

.topic-title a:hover {
  color: var(--seal);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.topic-excerpt {
  margin: 0 0 8px;
  color: var(--text-2);
  line-height: 1.6;
}

.topic-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.topic-replies {
  flex: none;
  min-width: 52px;
  text-align: center;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.reply-num {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.archive-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.date-chip {
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--text-2);
  padding: 4px 9px;
  border-radius: 6px;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}

.date-chip:hover { border-color: var(--seal-line); color: var(--seal); }
.date-chip-on {
  background: var(--seal-soft);
  border-color: var(--seal-line);
  color: var(--seal);
  font-weight: 600;
}

@media (max-width: 640px) {
  .topic-row { padding: 14px 16px; gap: 12px; }
}
</style>
