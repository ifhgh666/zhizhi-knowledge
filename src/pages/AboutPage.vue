<script setup>
import { computed } from 'vue'
import { issueNewUrl } from '../data.js'

const props = defineProps({
  blog: { type: Object, required: true },
})

const profile = computed(() => props.blog.profile ?? {})
</script>

<template>
  <section class="page-sec">
    <div class="card about-hero">
      <img class="about-avatar" :src="'./avatar.jpg'" :alt="profile.name" />
      <div class="about-intro">
        <h1 class="about-name">你好，我是 {{ profile.name || 'if' }}</h1>
        <div class="about-tags">
          <span class="tag-pill tag-pill-green">后端学习中</span>
          <span class="tag-pill tag-pill-green">大模型 / Agent</span>
          <span class="tag-pill">热爱学习新技术</span>
          <span class="tag-pill">慢热但熟了很热情</span>
        </div>
        <p v-for="(p, idx) in profile.aboutParagraphs" :key="idx" class="about-p">
          {{ p }}
        </p>
      </div>
    </div>

    <div class="sec-head">
      <h2 class="sec-title">平时喜欢</h2>
    </div>

    <div class="hobby-grid">
      <div v-for="h in profile.hobbies" :key="h.name" class="card hobby-card">
        <span class="hobby-icon">{{ h.icon }}</span>
        <div>
          <strong class="hobby-name">{{ h.name }}</strong>
          <p class="hobby-desc">{{ h.desc }}</p>
        </div>
      </div>
    </div>

    <div class="sec-head">
      <h2 class="sec-title">快捷更新入口（基于 GitHub Issues）</h2>
    </div>

    <div class="card cms-card">
      <p class="small muted" style="margin:0 0 14px">
        这个博客用 GitHub Issues 作为写作后台。无论在电脑还是手机上，点下面按钮提交一条 Issue（只有我自己的账号 <code>ifhgh666</code> 创建的内容会生效），约 30 秒就会自动构建并同步到网站：
      </p>
      <div class="cms-actions">
        <a class="btn btn-primary btn-sm" :href="issueNewUrl(profile.repo, 'post.yml')" target="_blank" rel="noreferrer">
          📝 写学习文章
        </a>
        <a class="btn btn-sm" :href="issueNewUrl(profile.repo, 'moment.yml')" target="_blank" rel="noreferrer">
          💬 发日常随笔
        </a>
        <a class="btn btn-sm" :href="issueNewUrl(profile.repo, 'recommend.yml')" target="_blank" rel="noreferrer">
          🔖 添加推荐收藏
        </a>
        <a class="btn btn-sm" :href="profile.github" target="_blank" rel="noreferrer">
          GitHub 主页 (@ifhgh666) ↗
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about-hero {
  margin-top: 24px;
  padding: 28px 32px;
  display: flex;
  align-items: flex-start;
  gap: 28px;
}

.about-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  flex: none;
  border: 3px solid var(--green-soft);
}

.about-name {
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 800;
}

.about-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.about-p {
  margin: 0 0 10px;
  color: var(--text-2);
  font-size: 14.5px;
  line-height: 1.75;
}

.about-p:last-child {
  margin-bottom: 0;
}

.hobby-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.hobby-card {
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.hobby-icon {
  font-size: 24px;
  line-height: 1;
}

.hobby-name {
  display: block;
  font-size: 15px;
  margin-bottom: 3px;
}

.hobby-desc {
  margin: 0;
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.5;
}

.cms-card {
  padding: 20px 24px;
}

.cms-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 820px) {
  .about-hero {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .about-tags { justify-content: center; }
  .hobby-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 520px) {
  .hobby-grid { grid-template-columns: 1fr; }
}
</style>
