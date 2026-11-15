<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import HomePage from './pages/HomePage.vue'
import ProjectsPage from './pages/ProjectsPage.vue'
import PostsPage from './pages/PostsPage.vue'
import MomentsPage from './pages/MomentsPage.vue'
import RecommendsPage from './pages/RecommendsPage.vue'
import AboutPage from './pages/AboutPage.vue'
import { loadBlog, issueNewUrl } from './data.js'

const NAV = [
  { key: 'home', label: '首页', comp: HomePage },
  { key: 'projects', label: '项目', comp: ProjectsPage },
  { key: 'posts', label: '学习', comp: PostsPage },
  { key: 'moments', label: '随笔', comp: MomentsPage },
  { key: 'recommends', label: '推荐', comp: RecommendsPage },
  { key: 'about', label: '关于我', comp: AboutPage },
]

const active = ref('home')
const params = ref({})
const blog = ref(null)
const error = ref('')

function readHash() {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [rawKey, qs] = raw.split('?')
  const key = rawKey || 'home'
  active.value = NAV.some((n) => n.key === key) ? key : 'home'
  params.value = Object.fromEntries(new URLSearchParams(qs ?? ''))
}

function go(key, query) {
  const clean = Object.fromEntries(
    Object.entries(query ?? {}).filter(([, v]) => v !== '' && v !== null && v !== undefined),
  )
  const qs = Object.keys(clean).length ? `?${new URLSearchParams(clean)}` : ''
  window.location.hash = key === 'home' && !qs ? '#/' : `#/${key}${qs}`
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const currentComp = computed(() => NAV.find((n) => n.key === active.value)?.comp ?? HomePage)
const profile = computed(() => blog.value?.profile ?? { name: 'if', blogTitle: 'if 的个人博客', github: 'https://github.com/ifhgh666', repo: 'ifhgh666/zhizhi-knowledge' })

onMounted(async () => {
  if (!window.location.hash) window.location.hash = '#/'
  readHash()
  window.addEventListener('hashchange', readHash)
  try {
    blog.value = await loadBlog()
  } catch (err) {
    error.value = err.message
  }
})

onBeforeUnmount(() => window.removeEventListener('hashchange', readHash))
</script>

<template>
  <div class="site">
    <!-- 顶部栏：左绿叶品牌 + 右胶囊导航 -->
    <header class="topbar">
      <div class="container topbar-inner">
        <a href="#/" class="brand" @click.prevent="go('home')">
          <svg class="leaf-logo" viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
            <path d="M27 5C16 5 8 11.5 6.8 22C6.5 24.5 8 25.8 10.2 25.5C20.5 24.3 27 16 27 5Z" fill="#52a447" />
            <path d="M27 5C18.5 10.5 12 17 6.8 25.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
            <path d="M6.8 25.5L4.5 27.8" stroke="#3d8b40" stroke-width="2.2" stroke-linecap="round" />
          </svg>
          <span class="brand-name">{{ profile.blogTitle }}</span>
        </a>

        <nav class="topnav" aria-label="主导航">
          <button
            v-for="item in NAV"
            :key="item.key"
            type="button"
            class="nav-item"
            :class="{ 'nav-item-active': active === item.key }"
            @click="go(item.key)"
          >
            {{ item.label }}
          </button>
        </nav>
      </div>
    </header>

    <main class="container main-body">
      <div v-if="error" class="card" style="padding:28px; text-align:center; margin-top:24px">
        加载失败：{{ error }}
      </div>
      <component
        :is="currentComp"
        v-else-if="blog"
        :blog="blog"
        :params="params"
        @navigate="go"
      />
    </main>

    <!-- 底部栏：与参考图一致 -->
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-left">
          <svg viewBox="0 0 32 32" width="18" height="18" aria-hidden="true">
            <path d="M27 5C16 5 8 11.5 6.8 22C6.5 24.5 8 25.8 10.2 25.5C20.5 24.3 27 16 27 5Z" fill="#52a447" />
            <path d="M27 5C18.5 10.5 12 17 6.8 25.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
          </svg>
          <strong class="footer-brand">{{ profile.blogTitle }}</strong>
          <span class="footer-sep">|</span>
          <span class="tiny muted">记录项目 · 学习技术 · 分享思考</span>
        </div>

        <div class="footer-right tiny muted">
          <span>© 2026 {{ profile.name }}. 保留所有权利。</span>
          <span class="footer-sep">|</span>
          <a
            class="footer-icon"
            :href="profile.github"
            target="_blank"
            rel="noreferrer"
            title="GitHub 主页"
            aria-label="GitHub 主页"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.39-3.87-1.39-.52-1.33-1.28-1.68-1.28-1.68-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.02 11.02 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
          </a>
          <a
            class="footer-icon"
            :href="issueNewUrl(profile.repo, 'post.yml')"
            target="_blank"
            rel="noreferrer"
            title="在 GitHub 上写新文章"
            aria-label="写新文章"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9" stroke-linecap="round" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke-linejoin="round" />
            </svg>
          </a>
          <a
            class="footer-icon"
            :href="issueNewUrl(profile.repo, 'moment.yml')"
            target="_blank"
            rel="noreferrer"
            title="发一条随笔动态"
            aria-label="发随笔"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke-linejoin="round" />
            </svg>
          </a>
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
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}

.topbar-inner {
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  flex: none;
}

.brand-name {
  font-size: 16.5px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.01em;
}

.topnav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-item {
  border: none;
  background: transparent;
  padding: 6px 15px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-2);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  color: var(--green-dark);
  background: var(--surface-2);
}

.nav-item-active {
  background: var(--green-soft);
  color: var(--green-dark);
  font-weight: 600;
}

.main-body {
  flex: 1;
  padding-bottom: 42px;
}

.footer {
  border-top: 1px solid var(--line);
  background: var(--surface);
  padding: 18px 0;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.footer-left, .footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.footer-brand {
  font-size: 14px;
  color: var(--text);
}

.footer-sep {
  color: var(--line-strong);
}

.footer-icon {
  color: var(--text-2);
  display: inline-flex;
  align-items: center;
  transition: color 0.15s;
}

.footer-icon:hover {
  color: var(--green);
}

@media (max-width: 680px) {
  .topbar-inner {
    height: auto;
    padding-top: 10px;
    padding-bottom: 10px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .topnav {
    width: 100%;
    overflow-x: auto;
  }
  .nav-item { padding: 5px 12px; }
}
</style>
