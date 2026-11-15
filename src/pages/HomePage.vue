<script setup>
import { ref, computed, onMounted } from 'vue'
import PageHero from '../components/PageHero.vue'
import { dataApi, categoryLabel, formatTime, formatDateOnly, formatMonthLabel } from '../data.js'

const emit = defineEmits(['navigate'])

const loading = ref(true)
const error = ref('')
const index = ref(null)
const rank = ref(null)
const v2ex = ref(null)
const periodical = ref(null)
const rankCat = ref('text')

const topModels = computed(() => (rank.value?.categories?.[rankCat.value] ?? []).slice(0, 6))
const availableCats = computed(() => {
  const keys = index.value?.rank?.categories ?? Object.keys(rank.value?.categories ?? {})
  return keys.length ? keys : ['text']
})
const topV2ex = computed(() => (v2ex.value?.items ?? []).slice(0, 6))
const topIssues = computed(() => (periodical.value?.items ?? []).slice(0, 4))

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const idx = await dataApi.index()
    index.value = idx
    const latestMonth = idx.rank?.months?.[0]
    const latestDate = idx.v2ex?.dates?.[0]
    const [r, v, p] = await Promise.all([
      latestMonth ? dataApi.rankMonth(latestMonth).catch(() => null) : null,
      latestDate ? dataApi.v2exDay(latestDate).catch(() => null) : null,
      dataApi.periodical().catch(() => null),
    ])
    rank.value = r
    v2ex.value = v
    periodical.value = p
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
      eyebrow="KNOWLEDGE DIGEST · 每日自动更新"
      title="知知知识又又又增加了"
      subtitle="聚合每日大模型能力榜单、V2EX 社区热议与 HelloGitHub 开源月刊，翻一翻就能跟上技术风向。"
      stamp="知"
    />

    <div v-if="loading" class="card empty-box">正在载入最新一期知识摘要…</div>
    <div v-else-if="error" class="card empty-box">载入失败：{{ error }}</div>

    <template v-else>
      <p class="summary-strip">
        <span>已收录</span>
        <strong>{{ index?.rank?.months?.length ?? 0 }}</strong> 个月大模型榜单
        <span>·</span>
        <strong>{{ index?.v2ex?.dates?.length ?? 0 }}</strong> 天 V2EX 热议
        <span>·</span>
        <strong>{{ periodical?.items?.length ?? 0 }}</strong> 期开源月刊
        <template v-if="index?.updatedAt">
          <span>·</span>
          <span>同步于 {{ formatTime(index.updatedAt) }}</span>
        </template>
      </p>

      <div class="two-col">
        <div class="home-main">
          <!-- 模块一：大模型榜单速览 -->
          <section class="card main-panel">
            <div class="panel-head">
              <div class="head-left">
                <h2 class="panel-title">大模型榜单 · {{ formatMonthLabel(rank?.month) }}</h2>
                <div class="mini-tabs">
                  <button
                    v-for="cat in availableCats"
                    :key="cat"
                    type="button"
                    class="mini-tab"
                    :class="{ 'mini-tab-on': rankCat === cat }"
                    @click="rankCat = cat"
                  >
                    {{ categoryLabel(cat) }}
                  </button>
                </div>
              </div>
              <button type="button" class="btn btn-seal-soft" @click="emit('navigate', 'rank', { cat: rankCat })">
                完整榜单 →
              </button>
            </div>

            <ul v-if="topModels.length" class="digest-list">
              <li v-for="m in topModels" :key="m.name" class="digest-row">
                <span class="rank-num" :class="`top-${m.position}`">{{ String(m.position).padStart(2, '0') }}</span>
                <div class="digest-body">
                  <div class="digest-title-row">
                    <span class="digest-title">{{ m.name }}</span>
                    <span v-if="m.organization" class="pill">{{ m.organization }}</span>
                    <span v-if="m.license && m.license !== 'Proprietary'" class="pill pill-ok">开源</span>
                  </div>
                  <div class="tiny muted meta-row">
                    <span v-if="m.rating">评分 {{ m.rating }}</span>
                    <span v-if="m.votes">· {{ m.votes.toLocaleString() }} 票</span>
                    <span v-if="m.inputPrice !== null && m.outputPrice !== null">
                      · ${{ m.inputPrice }} / ${{ m.outputPrice }} 每百万 tokens
                    </span>
                  </div>
                </div>
                <span class="delta" :class="m.change > 0 ? 'delta-up' : m.change < 0 ? 'delta-down' : m.change === null ? 'delta-new' : ''">
                  {{ m.change === null ? '新上榜' : m.change > 0 ? `↑${m.change}` : m.change < 0 ? `↓${Math.abs(m.change)}` : '—' }}
                </span>
              </li>
            </ul>
            <div v-else class="empty-box small">暂无该分类榜单数据</div>
          </section>

          <!-- 模块二：V2EX 今日热议 -->
          <section class="card main-panel">
            <div class="panel-head">
              <h2 class="panel-title">V2EX 热议 · {{ v2ex?.date ?? '最新' }}</h2>
              <button type="button" class="btn btn-seal-soft" @click="emit('navigate', 'v2ex')">
                全部 {{ v2ex?.items?.length ?? 0 }} 条 →
              </button>
            </div>

            <ul v-if="topV2ex.length" class="digest-list">
              <li v-for="(item, idx) in topV2ex" :key="item.url" class="digest-row">
                <span class="rank-num" :class="`top-${idx + 1}`">{{ String(idx + 1).padStart(2, '0') }}</span>
                <div class="digest-body">
                  <a class="digest-title link-title" :href="item.url" target="_blank" rel="noreferrer">
                    {{ item.title }}
                  </a>
                  <div class="tiny muted meta-row">
                    <span v-if="item.node" class="pill">{{ item.node }}</span>
                    <span v-if="item.author">@{{ item.author }}</span>
                  </div>
                </div>
                <span class="reply-badge tiny">{{ item.replies }} 回复</span>
              </li>
            </ul>
            <div v-else class="empty-box small">暂无热议数据</div>
          </section>

          <!-- 模块三：开源月刊 -->
          <section class="card main-panel">
            <div class="panel-head">
              <h2 class="panel-title">HelloGitHub 开源月刊 · 最新几期</h2>
              <button type="button" class="btn btn-seal-soft" @click="emit('navigate', 'periodical')">
                共 {{ periodical?.items?.length ?? 0 }} 期 →
              </button>
            </div>

            <ul v-if="topIssues.length" class="digest-list">
              <li v-for="issue in topIssues" :key="issue.url" class="digest-row">
                <span class="vol-badge serif">{{ issue.volume ?? '—' }}</span>
                <div class="digest-body">
                  <a class="digest-title link-title" :href="issue.url" target="_blank" rel="noreferrer">
                    {{ issue.title }}
                  </a>
                  <div class="issue-tags">
                    <span v-if="issue.total" class="pill pill-seal">{{ issue.total }} 个项目</span>
                    <span v-for="c in issue.categories.slice(0, 5)" :key="c.name" class="pill">
                      {{ c.name }} ({{ c.count }})
                    </span>
                  </div>
                </div>
                <span class="tiny muted">{{ formatDateOnly(issue.publishedAt) }}</span>
              </li>
            </ul>
            <div v-else class="empty-box small">暂无月刊数据</div>
          </section>
        </div>

        <!-- 右侧栏 -->
        <aside class="side-col">
          <div class="card side-card">
            <h3 class="side-title">本期概览</h3>
            <div class="kv-list">
              <div class="kv-row">
                <span class="muted">最新榜单月度</span>
                <span class="kv-val">{{ rank?.month ?? '—' }}</span>
              </div>
              <div class="kv-row">
                <span class="muted">V2EX 最新期</span>
                <span class="kv-val">{{ v2ex?.date ?? '—' }}</span>
              </div>
              <div class="kv-row">
                <span class="muted">月刊最新一期</span>
                <span class="kv-val">{{ topIssues[0]?.volume ? `第 ${topIssues[0].volume} 期` : '—' }}</span>
              </div>
              <div class="kv-row">
                <span class="muted">文本榜榜首</span>
                <span class="kv-val">{{ rank?.categories?.text?.[0]?.name ?? '—' }}</span>
              </div>
            </div>
          </div>

          <div class="card side-card">
            <h3 class="side-title">板块导航</h3>
            <div class="quick-links">
              <button type="button" class="quick-btn" @click="emit('navigate', 'rank')">
                <strong>大模型榜单</strong>
                <span class="tiny muted">文本、Web、视觉、文生图/视频 5 个赛道按月对比</span>
              </button>
              <button type="button" class="quick-btn" @click="emit('navigate', 'v2ex')">
                <strong>V2EX 热议</strong>
                <span class="tiny muted">每天留存一份热议快照，支持按日回看</span>
              </button>
              <button type="button" class="quick-btn" @click="emit('navigate', 'periodical')">
                <strong>开源月刊</strong>
                <span class="tiny muted">历期 HelloGitHub 月刊目录与分类分布</span>
              </button>
            </div>
          </div>

          <div class="card side-card">
            <h3 class="side-title">关于本站</h3>
            <p class="tiny muted" style="margin:0; line-height:1.7">
              这是一个纯信息浏览站，所有内容每日定时自动抓取并静态发布，只保留标题、摘要、榜单指标和原文链接，点击条目即可跳转源站阅读详情。
            </p>
          </div>
        </aside>
      </div>
    </template>
  </section>
</template>

<style scoped>
.home-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.mini-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.mini-tab {
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--muted);
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 999px;
  cursor: pointer;
}

.mini-tab:hover { color: var(--text); }
.mini-tab-on {
  background: var(--seal-soft);
  border-color: var(--seal-line);
  color: var(--seal);
  font-weight: 600;
}

.digest-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.digest-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 22px;
  border-bottom: 1px solid var(--line);
  transition: background 0.12s;
}

.digest-row:last-child { border-bottom: none; }
.digest-row:hover { background: #fdfbf7; }

.digest-body {
  flex: 1;
  min-width: 0;
}

.digest-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.digest-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.45;
}

.link-title:hover {
  color: var(--seal);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.delta {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.delta-up { color: var(--ok); }
.delta-down { color: var(--seal); }
.delta-new { color: var(--amber); }

.reply-badge {
  flex: none;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-2);
  font-weight: 600;
  white-space: nowrap;
}

.vol-badge {
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: 8px;
  background: var(--seal-soft);
  color: var(--seal);
  border: 1px solid var(--seal-line);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.issue-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.quick-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-btn {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.quick-btn strong {
  font-size: 14px;
  color: var(--text);
}

.quick-btn:hover {
  border-color: var(--seal-line);
  background: var(--seal-soft);
}

@media (max-width: 640px) {
  .digest-row { padding: 12px 16px; }
}
</style>
