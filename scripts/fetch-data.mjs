/**
 * 个人博客数据构建脚本：
 *  1. 读取 content/seed.json 里的基础配置与初始内容（可在 GitHub 网页直接编辑）。
 *  2. 拉取仓库主人（ifhgh666）在本仓库创建的 GitHub Issues：
 *     - 标签含「文章」或「post」→ 自动加入「学习（文章）」板块
 *     - 标签含「随笔」或「动态」或「moment」→ 自动加入「随笔」板块
 *     - 标签含「推荐」或「收藏」或「recommend」→ 自动加入「推荐」板块
 *  3. 生成前端直接读取的 public/data/blog.json。
 */
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SEED_FILE = path.join(ROOT, 'content', 'seed.json')
const OUT_DIR = path.join(ROOT, 'public', 'data')
const OUT_FILE = path.join(OUT_DIR, 'blog.json')

const OWNER = 'ifhgh666'
const REPO = 'zhizhi-knowledge'

/** 解析 GitHub Issue 表单模板生成的 `### 字段名 \n\n 内容` 结构 */
function parseIssueSections(body) {
  const text = String(body ?? '').replace(/\r\n/g, '\n').trim()
  if (!text.startsWith('### ')) {
    return { _raw: text }
  }
  const map = { _raw: text }
  const blocks = text.split(/\n(?=###\s+)/)
  for (const b of blocks) {
    const m = b.match(/^###\s+([^\n]+)\n+([\s\S]*)$/)
    if (!m) continue
    const key = m[1].trim()
    const val = m[2].trim()
    map[key] = val === '_No response_' ? '' : val
  }
  return map
}

function makeExcerpt(md, max = 90) {
  const s = String(md ?? '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`~_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return s.length > max ? `${s.slice(0, max)}…` : s
}

async function fetchOwnerIssues() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/issues?creator=${OWNER}&state=open&per_page=100`
  const headers = {
    'User-Agent': 'if-personal-blog/1.0',
    Accept: 'application/vnd.github+json',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) })
    if (!res.ok) {
      console.warn(`[issues]跳过同步（HTTP ${res.status}）`)
      return []
    }
    const items = await res.json()
    return (Array.isArray(items) ? items : []).filter(
      (it) => !it.pull_request && it.user?.login?.toLowerCase() === OWNER.toLowerCase(),
    )
  } catch (err) {
    console.warn(`[issues] 网络请求失败，使用本地 seed.json：${err.message}`)
    return []
  }
}

const seed = JSON.parse(await readFile(SEED_FILE, 'utf8'))
const issues = await fetchOwnerIssues()

const issuePosts = []
const issueMoments = []
const issueRecommends = []

for (const it of issues) {
  const labels = (it.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name ?? '').toLowerCase())
  const sec = parseIssueSections(it.body)
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date(it.created_at))

  if (labels.some((l) => ['随笔', '动态', 'moment'].includes(l))) {
    const content = sec['内容（支持 Markdown 和直接粘贴图片）'] ?? sec._raw
    const tag = sec['标签'] || '日常随想'
    if (content) {
      issueMoments.push({
        id: `issue-${it.number}`,
        issueUrl: it.html_url,
        date,
        tag,
        content,
      })
    }
  } else if (labels.some((l) => ['推荐', '收藏', 'recommend'].includes(l))) {
    const url = sec['链接地址'] || ''
    const category = sec['分类'] || '好物推荐'
    const summary = sec['推荐理由 / 简介'] || makeExcerpt(sec._raw, 100)
    if (url) {
      issueRecommends.push({
        id: `issue-${it.number}`,
        title: it.title.trim(),
        category,
        url,
        summary,
        featured: true,
      })
    }
  } else {
    // 默认归为「文章 / 学习笔记」
    const category = sec['分类'] || '学习笔记'
    const rawTags = sec['标签（用逗号分隔）'] || ''
    const tags = rawTags
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const content = sec['正文内容（支持 Markdown，可直接粘贴图片）'] ?? sec._raw
    const summary = sec['一句话摘要（可选，不填会自动截取正文前几句）'] || makeExcerpt(content, 85)
    issuePosts.push({
      id: `issue-${it.number}`,
      issueUrl: it.html_url,
      title: it.title.trim(),
      summary,
      category,
      tags: tags.length ? tags : [category],
      date,
      content,
    })
  }
}

const blog = {
  updatedAt: new Date().toISOString(),
  profile: seed.profile,
  projects: seed.projects ?? [],
  posts: [...issuePosts, ...(seed.posts ?? [])],
  moments: [...issueMoments, ...(seed.moments ?? [])],
  recommends: [...issueRecommends, ...(seed.recommends ?? [])],
}

// 清理之前旧站遗留的 index.json
const oldIndex = path.join(OUT_DIR, 'index.json')
if (existsSync(oldIndex)) await rm(oldIndex, { force: true })

await mkdir(OUT_DIR, { recursive: true })
await writeFile(OUT_FILE, `${JSON.stringify(blog, null, 2)}\n`, 'utf8')
console.log(
  `✓ 博客数据已生成：项目 ${blog.projects.length} 个 / 文章 ${blog.posts.length} 篇 / 随笔 ${blog.moments.length} 条 / 推荐 ${blog.recommends.length} 个（其中来自 Issues：${issues.length} 条）`,
)
