<script setup>
import { ref, computed } from 'vue'
import ProjectCard from '../components/ProjectCard.vue'

const props = defineProps({
  blog: { type: Object, required: true },
})

const activeCat = ref('全部')

const projects = computed(() => props.blog.projects ?? [])
const categories = computed(() => {
  const s = new Set(projects.value.map((p) => p.category).filter(Boolean))
  return ['全部', ...s]
})

const filtered = computed(() => {
  if (activeCat.value === '全部') return projects.value
  return projects.value.filter((p) => p.category === activeCat.value)
})
</script>

<template>
  <section class="page-sec">
    <div class="sec-head" style="margin-top:22px">
      <h1 class="sec-title" style="font-size:22px">我的项目</h1>
      <a
        class="btn btn-sm"
        :href="blog.profile?.github || 'https://github.com/ifhgh666'"
        target="_blank"
        rel="noreferrer"
      >
        GitHub 全部仓库 ↗
      </a>
    </div>
    <p class="muted small" style="margin:0 0 18px">
      在学习大模型、Agent 与后端开发过程中动手做的一些实践项目与日常小工具。
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
    </div>

    <div class="proj-grid">
      <ProjectCard v-for="p in filtered" :key="p.id" :project="p" />
    </div>
  </section>
</template>

<style scoped>
.proj-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 820px) {
  .proj-grid {
    grid-template-columns: 1fr;
  }
}
</style>
