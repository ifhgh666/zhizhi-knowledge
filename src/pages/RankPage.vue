<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import PageHero from '../components/PageHero.vue'
import { dataApi, categoryLabel, formatTime, formatMonthLabel } from '../data.js'

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  indexData: { type: Object, default: null },
})
const emit = defineEmits(['navigate'])

const months = ref([])
const categories = ref(['text'])
const activeMonth = ref('')
const activeCat = ref('text')
const monthData = ref(null)
const loading = ref(true)
const error = ref('')

const list = computed(() => monthData.value?.categories?.[activeCat.value] ?? [])
const monthIdx = computed(() => months.value.indexOf(activeMonth.value))
const isLatest = computed(() => monthIdx.value === 0)

const totalVotes = computed(() => list.value.reduce((s, m) => s + (m.votes ?? 0), 0))
const openSourceCount = computed(() => list.value.filter((m) => m.license && m.license !== 'Proprietary').length)

const orgStats = computed(() => {
  const counts = new Map()
  for (const m of list.value) {
    const key = m.organization || '其他'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const rows = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  const max = rows[0]?.count ?? 1
  return rows.map((r) => ({ ...r, pct: Math.round((r.count / max) * 100) }))
})

async function loadMonth(ym) {
  if (!ym) return
  loading.value = true
  error.value = ''
  try {
    monthData.value = await dataApi.rankMonth(ym)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function setCat(cat) {
  activeCat.value = cat
  emit('navigate', 'rank', { month: activeMonth.value, cat })
}

function setMonth(ym) {
  if (!ym || ym === activeMonth.value) return
  activeMonth.value = ym
  emit('navigate', 'rank', { month: ym, cat: activeCat.value })
  void loadMonth(ym)
}

function shiftMonth(delta) {
  // months 是降序（最新在前），所以上一月 = index + 1，下一月 = index - 1
  const next = months.value[monthIdx.value - delta]
  if (next) setMonth(next)
}

function formatPrice(m) {
  if (m.inputPrice === null && m.outputPrice === null) return ''
  const fmt = (n) => (n === null ? '—' : `$${n}`)
  return `输入 ${fmt(m.inputPrice)} / 输出 ${fmt(m.outputPrice)}`
}

onMounted(async () => {
  try {
    const idx = props.indexData ?? (await dataApi.index())
    months.value = idx.rank?.months ?? []
    categories.value = idx.rank?.categories?.length ? idx.rank.categories : ['text']
    const reqMonth = props.params.month
    activeMonth.value = months.value.includes(reqMonth) ? reqMonth : (months.value[0] ?? '')
    const reqCat = props.params.cat
    activeCat.value = categories.value.includes(reqCat) ? reqCat : categories.value[0]
    if (activeMonth.value) await loadMonth(activeMonth.value)
    else loading.value = false
  } catch (err) {
    error.value = err.message
    loading.value = false
  }
})

watch(() => props.params, (next) => {
  if (next.cat && categories.value.includes(next.cat)) activeCat.value = next.cat
  if (next.month && months.value.includes(next.month) && next.month !== activeMonth.value) {
    activeMonth.value = next.month
    void loadMonth(next.month)
  }
})
</script>

<template>
  <section>
    <PageHero
      eyebrow="RANKING · 数据源自 HelloGitHub"
      title="大模型榜单"
      subtitle="按文本、Web 开发、多模态视觉、文生图、文生视频 5 个赛道按月展示社区盲测评分、投票与价格参考。"
      stamp="榜"
    />

    <!-- 控件栏：左赛道切换 + 右月份翻页 -->
    <div class="card control-bar">
      <div class="seg-group" role="tablist" aria-label="榜单分类">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          class="seg-btn"
          :class="{ 'seg-btn-active': activeCat === cat }"
          @click="setCat(cat)"
        >
          {{ categoryLabel(cat) }}
        </button>
      </div>

      <div class="pager">
        <button
          type="button"
          class="btn pager-circle"
          title="上一个月"
          :disabled="monthIdx < 0 || monthIdx >= months.length - 1"
          @click="shiftMonth(-1)"
        >
          ‹
        </button>
        <span class="pager-current">{{ activeMonth || '—' }}</span>
        <button
          type="button"
          class="btn pager-circle"
          title="下一个月"
          :disabled="monthIdx <= 0"
          @click="shiftMonth(1)"
        >
          ›
        </button>
        <button
          type="button"
          class="btn btn-seal-soft"
          :disabled="isLatest || !months.length"
          @click="setMonth(months[0])"
        >
          回到本期
        </button>
      </div>
    </div>

    <p v-if="!loading && !error && list.length" class="summary-strip">
      <span>本期</span> <strong>{{ list.length }}</strong> <span>个模型上榜</span>
      <span>·</span>
      <span>共</span> <strong>{{ totalVotes.toLocaleString() }}</strong> <span>次投票</span>
      <span>·</span>
      <span>开源</span> <strong>{{ openSourceCount }}</strong> <span>个</span>
    </p>

    <div v-if="loading" class="card empty-box">正在载入榜单…</div>
    <div v-else-if="error" class="card empty-box">载入失败：{{ error }}</div>

    <div v-else class="two-col">
      <!-- 左侧主榜 -->
      <div class="card main-panel">
        <div class="panel-head">
          <h2 class="panel-title">{{ categoryLabel(activeCat) }} · {{ list.length }} 强</h2>
          <span class="tiny muted">统计月度 {{ formatMonthLabel(activeMonth) }}</span>
        </div>

        <ul v-if="list.length" class="rank-list">
          <li v-for="m in list" :key="m.name" class="rank-row">
            <span class="rank-num" :class="`top-${m.position}`">
              {{ String(m.position).padStart(2, '0') }}
            </span>

            <div class="model-info">
              <div class="model-head">
                <strong class="model-name">{{ m.name }}</strong>
                <span v-if="m.organization" class="pill">{{ m.organization }}</span>
                <span
                  v-if="m.license"
                  class="pill"
                  :class="m.license === 'Proprietary' ? '' : 'pill-ok'"
                >
                  {{ m.license === 'Proprietary' ? '闭源' : m.license }}
                </span>
              </div>
              <div class="tiny muted model-meta">
                <span v-if="m.votes">投票 {{ m.votes.toLocaleString() }}</span>
                <span v-if="formatPrice(m)">· {{ formatPrice(m) }}（美元 / 百万 tokens）</span>
              </div>
            </div>

            <div class="model-score">
              <div class="elo">{{ m.rating ?? '—' }}</div>
              <div
                class="tiny delta"
                :class="m.change > 0 ? 'delta-up' : m.change < 0 ? 'delta-down' : m.change === null ? 'delta-new' : 'muted'"
              >
                {{
                  m.change === null
                    ? '新上榜'
                    : m.change > 0
                      ? `上升 ${m.change}`
                      : m.change < 0
                        ? `下降 ${Math.abs(m.change)}`
                        : '持平'
                }}
              </div>
            </div>
          </li>
        </ul>
        <div v-else class="empty-box">该月份暂无此分类数据。</div>
      </div>

      <!-- 右侧概览 -->
      <aside class="side-col">
        <div class="card side-card">
          <h3 class="side-title">本期概览</h3>
          <div class="kv-list">
            <div class="kv-row">
              <span class="muted">入榜模型</span>
              <span class="kv-val">{{ list.length }}</span>
            </div>
            <div class="kv-row">
              <span class="muted">榜首评分</span>
              <span class="kv-val">{{ list[0]?.rating ?? '—' }}</span>
            </div>
            <div class="kv-row">
              <span class="muted">开源模型</span>
              <span class="kv-val">{{ openSourceCount }} / {{ list.length }}</span>
            </div>
            <div class="kv-row">
              <span class="muted">累计票数</span>
              <span class="kv-val">{{ totalVotes.toLocaleString() }}</span>
            </div>
            <div class="kv-row">
              <span class="muted">同步时间</span>
              <span class="kv-val tiny">{{ formatTime(monthData?.fetchedAt) }}</span>
            </div>
          </div>
        </div>

        <div v-if="orgStats.length" class="card side-card">
          <h3 class="side-title">厂商分布</h3>
          <div class="bar-list">
            <div v-for="o in orgStats" :key="o.name" class="bar-item">
              <div class="bar-head">
                <span>{{ o.name }}</span>
                <span class="muted">{{ o.count }} 个</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${o.pct}%` }" />
              </div>
            </div>
          </div>
        </div>

        <div class="card side-card">
          <h3 class="side-title">数据来源</h3>
          <p class="tiny muted" style="margin:0 0 10px; line-height:1.65">
            榜单原始数据来自 HelloGitHub 大模型排名页，本站已移除推广链接，仅保留公开评分与参考定价。
          </p>
          <a
            class="btn btn-seal-soft"
            style="width:100%"
            href="https://hellogithub.com/report/lm-rank"
            target="_blank"
            rel="noreferrer"
          >
            前往 HelloGitHub 原榜 ↗
          </a>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 15px 22px;
  border-bottom: 1px solid var(--line);
  transition: background 0.12s;
}

.rank-row:last-child { border-bottom: none; }
.rank-row:hover { background: #fdfbf7; }

.model-info {
  flex: 1;
  min-width: 0;
}

.model-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.model-name {
  font-size: 15.5px;
  font-weight: 650;
  color: var(--text);
}

.model-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.model-score {
  text-align: right;
  flex: none;
}

.elo {
  font-size: 17px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.delta { font-weight: 600; }
.delta-up { color: var(--ok); }
.delta-down { color: var(--seal); }
.delta-new { color: var(--amber); }

@media (max-width: 640px) {
  .rank-row { padding: 13px 16px; gap: 12px; }
  .elo { font-size: 15.5px; }
}
</style>
