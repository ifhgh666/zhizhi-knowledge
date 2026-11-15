<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import HomePage from './pages/HomePage.vue'
import RankPage from './pages/RankPage.vue'
import V2exPage from './pages/V2exPage.vue'
import PeriodicalPage from './pages/PeriodicalPage.vue'
import SearchPage from './pages/SearchPage.vue'
import { dataApi, formatTime } from './data.js'

const NAV = [
  { key: 'home', label: '首页', comp: HomePage },
  { key: 'rank', label: '大模型榜单', comp: RankPage },
  { key: 'v2ex', label: 'V2EX 热议', comp: V2exPage },
  { key: 'periodical', label: '开源月刊', comp: PeriodicalPage },
]

const ROUTE_LABEL = {
  home: '首页',
  rank: '大模型榜单',
  v2ex: 'V2EX 热议',
  periodical: '开源月刊',
  search: '站内搜索',
}

const active = ref('home')
const params = ref({})
const searchInput = ref('')
const indexData = ref(null)

function readHash() {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [rawKey, qs] = raw.split('?')
  const key = rawKey || 'home'
  const valid = ['home', 'rank', 'v2ex', 'periodical', 'search']
  active.value = valid.includes(key) ? key : 'home'
  params.value = Object.fromEntries(new URLSearchParams(qs ?? ''))
  if (active.value === 'search' && typeof params.value.q === 'string') {
    searchInput.value = params.value.q
  }
}

function go(key, query) {
  const clean = Object.fromEntries(
    Object.entries(query ?? {}).filter(([, v]) => v !== '' && v !== null && v !== undefined),
  )
  const qs = Object.keys(clean).length ? `?${new URLSearchParams(clean)}` : ''
  window.location.hash = key === 'home' && !qs ? '#/' : `#/${key}${qs}`
}

function submitSearch() {
  const q = searchInput.value.trim()
  go('search', q ? { q } : {})
}

const currentComp = computed(() => {
  if (active.value === 'search') return SearchPage
  return NAV.find((n) => n.key === active.value)?.comp ?? HomePage
})

onMounted(async () => {
  if (!window.location.hash) window.location.hash = '#/'
  readHash()
  window.addEventListener('hashchange', readHash)
  try {
    indexData.value = await dataApi.index()
  } catch { /* 各子页自己展示加载错误 */ }
})

onBeforeUnmount(() => window.removeEventListener('hashchange', readHash))
</script>

<template>
  <div class="site">
    <!-- 顶部导航栏（模仿参考图：左印章品牌 + 中横向导航 + 右搜索框） -->
    <header class="topbar">
      <div class="container topbar-inner">
        <a href="#/" class="brand" @click.prevent="go('home')">
          <span class="brand-stamp serif" aria-hidden="true">知</span>
          <span class="brand-name serif">知知知识又又又增加了</span>
        </a>

        <nav class="topnav" aria-label="主导航">
          <button
            v-for="item in NAV"
            :key="item.key"
            type="button"
            class="nav-link"
            :class="{ 'nav-link-active': active === item.key }"
            @click="go(item.key)"
          >
            {{ item.label }}
          </button>
        </nav>

        <form class="search-form" role="search" @submit.prevent="submitSearch">
          <input
            v-model="searchInput"
            class="search-input"
            type="search"
            placeholder="搜索模型、热议、月刊…"
            aria-label="站内搜索"
          />
          <button type="submit" class="search-btn" aria-label="搜索">
            <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="9" cy="9" r="6" />
              <path d="M13.5 13.5L17.5 17.5" stroke-linecap="round" />
            </svg>
          </button>
        </form>
      </div>
    </header>

    <main class="container page-body">
      <!-- 面包屑 -->
      <nav v-if="active !== 'home'" class="breadcrumb tiny" aria-label="面包屑">
        <a href="#/" @click.prevent="go('home')">首页</a>
        <span class="crumb-sep">/</span>
        <span>{{ ROUTE_LABEL[active] }}</span>
      </nav>

      <component
        :is="currentComp"
        :key="active"
        :params="params"
        :index-data="indexData"
        @navigate="go"
      />
    </main>

    <footer class="site-footer">
      <div class="container footer-inner tiny muted">
        <div>
          <strong>知知知识又又又增加了</strong> · 纯公开信息聚合页（大模型榜单与开源月刊源自
          <a href="https://hellogithub.com/" target="_blank" rel="noreferrer">HelloGitHub</a>，
          热议源自
          <a href="https://www.v2ex.com/?tab=hot" target="_blank" rel="noreferrer">V2EX</a>）
        </div>
        <div v-if="indexData?.updatedAt">
          最近同步：{{ formatTime(indexData.updatedAt) }}（北京时间）
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.site {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--line);
}

.topbar-inner {
  min-height: 60px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

.brand-stamp {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: var(--seal);
  color: #fff8f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(184, 50, 42, 0.25);
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--text);
}

.topnav {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: auto;
}

.nav-link {
  position: relative;
  border: none;
  background: transparent;
  padding: 18px 14px;
  font-size: 14.5px;
  color: var(--text-2);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s;
}

.nav-link:hover {
  color: var(--seal);
}

.nav-link-active {
  color: var(--seal);
  font-weight: 650;
}

.nav-link-active::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 0;
  height: 2.5px;
  border-radius: 2px 2px 0 0;
  background: var(--seal);
}

.search-form {
  position: relative;
  width: 220px;
  flex: none;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 36px 0 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--text);
  font-size: 13.5px;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}

.search-input:focus {
  border-color: var(--seal);
  background: var(--surface);
}

.search-input::placeholder {
  color: var(--muted);
}

.search-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.search-btn:hover {
  color: var(--seal);
}

.page-body {
  flex: 1;
  padding-top: 18px;
  padding-bottom: 56px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  margin-bottom: 8px;
}

.breadcrumb a:hover {
  color: var(--seal);
}

.crumb-sep {
  color: var(--line-strong);
}

.site-footer {
  border-top: 1px solid var(--line);
  background: var(--surface);
  padding: 18px 0;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.footer-inner a {
  color: var(--seal);
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (max-width: 860px) {
  .topbar-inner {
    flex-wrap: wrap;
    padding-top: 10px;
    padding-bottom: 8px;
    gap: 8px 16px;
  }
  .brand { order: 1; }
  .search-form { order: 2; margin-left: auto; width: 180px; }
  .topnav {
    order: 3;
    width: 100%;
    overflow-x: auto;
    border-top: 1px solid var(--line);
    padding-top: 2px;
  }
  .nav-link { padding: 10px 12px; }
}

@media (max-width: 520px) {
  .search-form { width: 148px; }
  .brand-name { font-size: 15px; }
}
</style>
