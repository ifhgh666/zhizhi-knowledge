<script setup>
import { computed } from 'vue'
import ProjectCard from '../components/ProjectCard.vue'

const props = defineProps({
  blog: { type: Object, required: true },
})
const emit = defineEmits(['navigate'])

const profile = computed(() => props.blog.profile ?? {})
const featuredProjects = computed(() => {
  const list = props.blog.projects ?? []
  const feat = list.filter((p) => p.featured)
  return (feat.length ? feat : list).slice(0, 2)
})
const tracks = computed(() => profile.value.learningTracks ?? [])
const latestPosts = computed(() => (props.blog.posts ?? []).slice(0, 3))
const latestMoments = computed(() => (props.blog.moments ?? []).slice(0, 2))
const topRecommend = computed(() => {
  const list = props.blog.recommends ?? []
  return list.find((r) => r.featured) ?? list[0] ?? null
})
</script>

<template>
  <div>
    <!-- ============ Hero 横幅（严格还原参考图：左圆形头像+右上三道线 / 中问候+绿笔刷下划线+双按钮 / 右远山背景） ============ -->
    <section class="hero">
      <!-- 右侧淡绿远山背景装饰 -->
      <svg class="hero-hills" viewBox="0 0 560 210" fill="none" aria-hidden="true">
        <path
          d="M60 210 C150 130 240 115 340 165 C410 110 480 95 560 140 L560 210 Z"
          fill="#e3f1e1"
          opacity="0.65"
        />
        <path
          d="M160 210 C250 145 330 135 430 178 C475 148 520 140 560 165 L560 210 Z"
          fill="#cfe6cc"
          opacity="0.55"
        />
        <path d="M370 95 Q376 88 382 95 Q388 88 394 95" stroke="#8ab886" stroke-width="1.6" fill="none" stroke-linecap="round" />
        <path d="M425 78 Q429 73 434 78 Q439 73 443 78" stroke="#8ab886" stroke-width="1.4" fill="none" stroke-linecap="round" />
      </svg>

      <div class="hero-avatar-wrap">
        <div class="avatar-ring">
          <img class="avatar-img" :src="'./avatar.jpg'" :alt="profile.name" />
        </div>
        <!-- 头像右上角的三道小射线 -->
        <svg class="avatar-rays" viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
          <line x1="6" y1="18" x2="12" y2="6" stroke="#2c3a2f" stroke-width="2.2" stroke-linecap="round" />
          <line x1="14" y1="21" x2="22" y2="11" stroke="#2c3a2f" stroke-width="2.2" stroke-linecap="round" />
          <line x1="20" y1="26" x2="28" y2="21" stroke="#2c3a2f" stroke-width="2.2" stroke-linecap="round" />
        </svg>
      </div>

      <div class="hero-content">
        <h1 class="hero-title">
          你好，我是
          <span class="hero-name">
            {{ profile.name || 'if' }}
            <svg class="brush-underline" viewBox="0 0 110 12" preserveAspectRatio="none" aria-hidden="true">
              <path d="M3 8 Q55 2 107 7" stroke="#5db454" stroke-width="5" stroke-linecap="round" fill="none" />
            </svg>
          </span>
        </h1>

        <p class="hero-bio">
          <template v-for="(line, i) in profile.bioLines" :key="i">
            {{ line }}<br v-if="i < profile.bioLines.length - 1" />
          </template>
        </p>

        <div class="hero-actions">
          <button type="button" class="btn btn-primary" @click="emit('navigate', 'projects')">
            <span style="font-family:monospace; font-weight:700">&lt;/&gt;</span>
            <span>查看项目</span>
          </button>
          <button type="button" class="btn" @click="emit('navigate', 'posts')">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M2.5 4.5h6a2 2 0 0 1 2 2v10a1.5 1.5 0 0 0-1.5-1.5h-6.5v-10.5z" />
              <path d="M17.5 4.5h-6a2 2 0 0 0-2 2v10a1.5 1.5 0 0 1 1.5-1.5h6.5v-10.5z" />
            </svg>
            <span>阅读博客</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ============ 精选项目 ============ -->
    <div class="sec-head">
      <h2 class="sec-title">精选项目</h2>
      <button type="button" class="sec-more" @click="emit('navigate', 'projects')">
        查看全部项目 →
      </button>
    </div>

    <div class="proj-grid">
      <ProjectCard v-for="p in featuredProjects" :key="p.id" :project="p" />
    </div>

    <!-- ============ 我的学习 ============ -->
    <div class="sec-head">
      <h2 class="sec-title">我的学习</h2>
    </div>

    <div class="learn-grid">
      <div
        v-for="t in tracks"
        :key="t.id"
        class="card learn-card"
        @click="emit('navigate', 'posts')"
      >
        <div class="learn-icon" aria-hidden="true">
          <!-- 层叠图标 -->
          <svg v-if="t.icon === 'layers'" viewBox="0 0 28 28" width="26" height="26" fill="none" stroke="#46963f" stroke-width="1.9">
            <polygon points="14 4 25 9.5 14 15 3 9.5 14 4" stroke-linejoin="round" />
            <polyline points="3 14.5 14 20 25 14.5" stroke-linecap="round" stroke-linejoin="round" />
            <polyline points="3 19.5 14 25 25 19.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <!-- 原子/探索图标 -->
          <svg v-else-if="t.icon === 'atom'" viewBox="0 0 28 28" width="26" height="26" fill="none" stroke="#46963f" stroke-width="1.8">
            <circle cx="14" cy="14" r="2.4" fill="#46963f" />
            <ellipse cx="14" cy="14" rx="11" ry="4.5" transform="rotate(30 14 14)" />
            <ellipse cx="14" cy="14" rx="11" ry="4.5" transform="rotate(-30 14 14)" />
            <ellipse cx="14" cy="14" rx="11" ry="4.5" transform="rotate(90 14 14)" />
          </svg>
          <!-- 后端数据库图标 -->
          <svg v-else viewBox="0 0 28 28" width="26" height="26" fill="none" stroke="#46963f" stroke-width="1.9">
            <ellipse cx="14" cy="7" rx="9" ry="3.5" />
            <path d="M5 7v7c0 1.93 4.03 3.5 9 3.5s9-1.57 9-3.5V7" />
            <path d="M5 14v7c0 1.93 4.03 3.5 9 3.5s9-1.57 9-3.5v-7" />
          </svg>
        </div>

        <div class="learn-body">
          <h3 class="learn-title">{{ t.title }}</h3>
          <p class="learn-desc">{{ t.desc }}</p>
        </div>
      </div>
    </div>

    <!-- ============ 最新文章 ============ -->
    <div class="sec-head">
      <h2 class="sec-title">最新文章</h2>
      <button type="button" class="sec-more" @click="emit('navigate', 'posts')">
        查看全部文章 →
      </button>
    </div>

    <div class="post-list">
      <button
        v-for="post in latestPosts"
        :key="post.id"
        type="button"
        class="post-row"
        @click="emit('navigate', 'posts', { id: post.id })"
      >
        <span class="post-doc-icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="#46963f" stroke-width="1.7">
            <rect x="3.5" y="2.5" width="13" height="15" rx="2" />
            <line x1="6.5" y1="7" x2="13.5" y2="7" stroke-linecap="round" />
            <line x1="6.5" y1="10.5" x2="13.5" y2="10.5" stroke-linecap="round" />
            <line x1="6.5" y1="14" x2="10.5" y2="14" stroke-linecap="round" />
          </svg>
        </span>
        <strong class="post-title">{{ post.title }}</strong>
        <span class="post-summary">{{ post.summary }}</span>
        <span class="post-date">{{ post.date }}</span>
      </button>
    </div>

    <!-- ============ 近期随笔 ============ -->
    <div class="sec-head">
      <h2 class="sec-title">近期随笔</h2>
      <button type="button" class="sec-more" @click="emit('navigate', 'moments')">
        查看全部随笔 →
      </button>
    </div>

    <div class="moment-grid">
      <div
        v-for="m in latestMoments"
        :key="m.id"
        class="card moment-card"
        @click="emit('navigate', 'moments')"
      >
        <div class="moment-top">
          <span class="tag-pill tag-pill-green">{{ m.tag }}</span>
          <span class="tiny muted">{{ m.date }}</span>
        </div>
        <p class="moment-text">{{ m.content }}</p>
      </div>
    </div>

    <!-- ============ 底部推荐横幅（严格复刻参考图的浅绿推荐条） ============ -->
    <a
      v-if="topRecommend"
      class="rec-banner"
      :href="topRecommend.url"
      target="_blank"
      rel="noreferrer"
    >
      <div class="rec-badge">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#46963f" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke-linejoin="round" />
        </svg>
        <span>推荐</span>
      </div>

      <div class="rec-main">
        <strong class="rec-title">{{ topRecommend.title }}</strong>
        <p class="rec-desc">{{ topRecommend.summary }}</p>
      </div>

      <span class="rec-ext" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="#46963f" stroke-width="1.8">
          <path d="M11 3h6v6" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M17 3L9.5 10.5" stroke-linecap="round" />
          <path d="M15 11.5v4a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 15.5v-9A1.5 1.5 0 0 1 4.5 5h4" stroke-linecap="round" />
        </svg>
      </span>
    </a>
  </div>
</template>

<style scoped>
/* ---------- Hero ---------- */

.hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 38px;
  padding: 36px 24px 28px;
  overflow: hidden;
}

.hero-hills {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 520px;
  max-width: 58%;
  height: auto;
  pointer-events: none;
  z-index: 0;
}

.hero-avatar-wrap {
  position: relative;
  z-index: 1;
  flex: none;
  margin-left: 36px;
}

.avatar-ring {
  width: 152px;
  height: 152px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #ffffff;
  box-shadow: 0 8px 24px rgba(30, 40, 32, 0.08);
  background: #e6f2fa;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-rays {
  position: absolute;
  top: 2px;
  right: -18px;
}

.hero-content {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.hero-title {
  margin: 0 0 14px;
  font-size: 33px;
  font-weight: 800;
  color: var(--text);
  line-height: 1.25;
}

.hero-name {
  position: relative;
  display: inline-block;
  padding: 0 2px;
}

.brush-underline {
  position: absolute;
  left: -2px;
  right: -6px;
  bottom: -5px;
  width: calc(100% + 8px);
  height: 10px;
}

.hero-bio {
  margin: 0 0 20px;
  font-size: 15px;
  line-height: 1.75;
  color: var(--text-2);
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ---------- 精选项目 ---------- */

.proj-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

/* ---------- 我的学习 ---------- */

.learn-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.learn-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.learn-card:hover {
  transform: translateY(-2px);
  border-color: #c6dfc5;
}

.learn-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--green-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.learn-body {
  min-width: 0;
}

.learn-title {
  margin: 0 0 3px;
  font-size: 15.5px;
  font-weight: 700;
}

.learn-desc {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.45;
}

/* ---------- 最新文章 ---------- */

.post-list {
  display: flex;
  flex-direction: column;
}

.post-row {
  width: 100%;
  border: none;
  border-bottom: 1px solid var(--line);
  background: transparent;
  padding: 14px 6px;
  display: grid;
  grid-template-columns: 24px minmax(220px, 310px) minmax(0, 1fr) 90px;
  align-items: center;
  gap: 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s;
}

.post-row:hover {
  background: var(--surface-2);
  border-radius: 8px;
}

.post-doc-icon {
  display: inline-flex;
  align-items: center;
}

.post-title {
  font-size: 15px;
  font-weight: 650;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-row:hover .post-title {
  color: var(--green-dark);
}

.post-summary {
  font-size: 13.5px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-date {
  font-size: 13px;
  color: var(--muted);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ---------- 近期随笔 ---------- */

.moment-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.moment-card {
  padding: 15px 18px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.moment-card:hover {
  border-color: #c6dfc5;
}

.moment-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.moment-text {
  margin: 0;
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.6;
}

/* ---------- 底部推荐横幅 ---------- */

.rec-banner {
  margin-top: 28px;
  padding: 16px 22px;
  border-radius: var(--radius);
  background: var(--green-banner);
  border: 1px solid #d8ecd6;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: border-color 0.15s, background 0.15s;
}

.rec-banner:hover {
  background: #e4f2e2;
  border-color: #bfe0bc;
}

.rec-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  padding-right: 18px;
  border-right: 1px solid #cfe4cd;
  flex: none;
}

.rec-main {
  flex: 1;
  min-width: 0;
}

.rec-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 2px;
}

.rec-desc {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-2);
}

.rec-ext {
  flex: none;
  display: inline-flex;
  align-items: center;
}

@media (max-width: 840px) {
  .hero {
    flex-direction: column;
    text-align: center;
    padding: 24px 12px;
    gap: 18px;
  }
  .hero-avatar-wrap { margin-left: 0; }
  .hero-actions { justify-content: center; }
  .proj-grid, .learn-grid, .moment-grid {
    grid-template-columns: 1fr;
  }
  .post-row {
    grid-template-columns: 22px 1fr auto;
  }
  .post-summary {
    display: none;
  }
}
</style>
