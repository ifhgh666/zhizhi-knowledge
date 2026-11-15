/**
 * 每日数据抓取：生成网站读取的静态 JSON（public/data/）。
 *
 * 由 GitHub Actions 每天定时运行，也可以本地手动跑：npm run fetch
 *
 * 数据源（都是公开页面 / 接口，无需密钥）：
 *  - 大模型榜单：https://hellogithub.com/report/lm-rank（页面内 __NEXT_DATA__ 里带结构化数据，
 *    支持 ?year=&month=&category= 参数）
 *  - V2EX 热议：https://www.v2ex.com/api/topics/hot.json
 *  - 开源月刊：https://hellogithub.com/rss
 *
 * 原则：
 *  - 只保存标题、摘要、榜单数字和原文链接，不搬运全文；去掉榜单里的推广链接。
 *  - 单个数据源失败不影响其它数据源；失败时保留旧数据，不写空文件。
 *  - 请求之间留间隔，对原站友好。
 */
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'public', 'data')
const UA = 'Mozilla/5.0 (compatible; zhizhi-knowledge/1.0; +https://github.com/ifhgh666/zhizhi-knowledge)'
const TIMEOUT = 20_000

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) throw new Error(`HTTP ${res.status}：${url}`)
  return res.text()
}

async function readJson(file, fallback = null) {
  try { return JSON.parse(await readFile(file, 'utf8')) } catch { return fallback }
}

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

/** 北京时间的日期（网站面向国内读者；Actions 服务器在 UTC 时区）。 */
function beijingDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(d)
}

const pad = (n) => String(n).padStart(2, '0')

/* ------------------------------------------------------------------ *
 * 大模型榜单
 * ------------------------------------------------------------------ */

const RANK_BASE = 'https://hellogithub.com/report/lm-rank'

function parseNextData(html) {
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!m) throw new Error('页面里没有找到 __NEXT_DATA__（页面结构可能变了）')
  return JSON.parse(m[1]).props?.pageProps ?? {}
}

/** 只保留展示需要的字段；推广链接（model_url_* / providers / ofox_*）一律丢弃。 */
function cleanModel(m) {
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
  return {
    position: num(m.position),
    name: String(m.name ?? '').trim(),
    organization: String(m.organization ?? '').trim(),
    license: String(m.license ?? '').trim(),
    rating: num(m.rating) === null ? null : Math.round(m.rating * 10) / 10,
    votes: num(m.votes),
    change: num(m.change), // 正数=上升，负数=下降，null=新上榜
    inputPrice: num(m.input_price),
    outputPrice: num(m.output_price),
    priceUnit: m.price_unit ?? null,
  }
}

async function fetchRankPage(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const html = await fetchText(`${RANK_BASE}${qs ? `?${qs}` : ''}`)
  return parseNextData(html)
}

async function updateRank() {
  const dir = path.join(DATA, 'lm-rank')
  const head = await fetchRankPage()
  const year = head.year
  const categories = Array.isArray(head.categoryList) && head.categoryList.length ? head.categoryList : ['text']
  const months = (Array.isArray(head.monthList) ? head.monthList : [head.month]).filter(Boolean)
  if (!year || !months.length) throw new Error('榜单页面没有年份 / 月份信息')

  const current = `${year}-${pad(head.month)}`
  const written = []
  for (const month of months) {
    const key = `${year}-${pad(month)}`
    const file = path.join(dir, `${key}.json`)
    // 历史月份只抓一次；当月每天刷新（月内数据会变）
    if (key !== current && existsSync(file)) continue

    const out = { month: key, source: RANK_BASE, fetchedAt: new Date().toISOString(), categories: {} }
    for (const cat of categories) {
      try {
        const p = (key === current && cat === head.category)
          ? head
          : await fetchRankPage({ year, month, category: cat })
        // 防御：请求了某月却返回了别的月（参数失效）时，不要写错数据
        if (p.year !== year || p.month !== month || p.category !== cat) {
          console.warn(`  [榜单] ${key} ${cat}：返回的是 ${p.year}-${p.month} ${p.category}，跳过`)
          continue
        }
        out.categories[cat] = (p.list ?? []).map(cleanModel).filter((m) => m.name)
      } catch (err) {
        console.warn(`  [榜单] ${key} ${cat} 失败：${err.message}`)
      }
      await sleep(400)
    }
    if (Object.keys(out.categories).length) {
      await writeJson(file, out)
      written.push(key)
    }
  }
  console.log(`✓ 大模型榜单：更新 ${written.length} 个月份（${written.join('、') || '无'}），分类 ${categories.join(' / ')}`)
  return { categories, current }
}

/* ------------------------------------------------------------------ *
 * V2EX 热议
 * ------------------------------------------------------------------ */

function plainExcerpt(text, max = 140) {
  const s = String(text ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // markdown 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // markdown 链接
    .replace(/<[^>]+>/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[#>*`_~-]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return s.length > max ? `${s.slice(0, max)}…` : s
}

async function updateV2ex() {
  const raw = JSON.parse(await fetchText('https://www.v2ex.com/api/topics/hot.json'))
  if (!Array.isArray(raw) || !raw.length) throw new Error('V2EX 返回为空')
  const date = beijingDate()
  const items = raw.map((t) => ({
    id: t.id,
    title: String(t.title ?? '').trim(),
    url: t.url ?? `https://www.v2ex.com/t/${t.id}`,
    replies: t.replies ?? 0,
    node: t.node?.title ?? '',
    nodeUrl: t.node?.url ?? '',
    author: t.member?.username ?? '',
    created: t.created ? new Date(t.created * 1000).toISOString() : null,
    excerpt: plainExcerpt(t.content),
  }))
  await writeJson(path.join(DATA, 'v2ex', `${date}.json`), {
    date, source: 'https://www.v2ex.com/?tab=hot', fetchedAt: new Date().toISOString(), items,
  })
  console.log(`✓ V2EX 热议：${date} 共 ${items.length} 条`)
}

/* ------------------------------------------------------------------ *
 * HelloGitHub 开源月刊（RSS）
 * ------------------------------------------------------------------ */

function decodeXml(s) {
  return String(s ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .trim()
}

const tag = (xml, name) => decodeXml(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1])

async function updatePeriodical() {
  const xml = await fetchText('https://hellogithub.com/rss')
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, it]) => {
    const title = tag(it, 'title')
    const desc = tag(it, 'description')
    const volume = Number(title.match(/第\s*(\d+)\s*期/)?.[1] ?? 0) || null
    const total = Number(desc.match(/共有\s*(\d+)\s*个项目/)?.[1] ?? 0) || null
    // "C 项目 (3)，Go 项目 (4)，人工智能 (5)" → [{name, count}]
    const cats = [...desc.replace(/^.*?包含/, '').matchAll(/([^，,()]+?)\s*\((\d+)\)/g)]
      .map(([, name, n]) => ({ name: name.trim(), count: Number(n) }))
    const pub = tag(it, 'pubDate')
    return {
      volume,
      title,
      url: tag(it, 'link'),
      total,
      categories: cats,
      publishedAt: pub ? new Date(pub).toISOString() : null,
    }
  }).filter((x) => x.title && x.url)

  if (!items.length) throw new Error('RSS 里没有解析到任何一期')
  items.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
  await writeJson(path.join(DATA, 'periodical.json'), {
    source: 'https://hellogithub.com/periodical', fetchedAt: new Date().toISOString(), items,
  })
  console.log(`✓ 开源月刊：共 ${items.length} 期（最新第 ${items[0].volume} 期）`)
}

/* ------------------------------------------------------------------ *
 * 汇总索引：前端先读这个文件，知道有哪些日期 / 月份可翻
 * ------------------------------------------------------------------ */

async function listJson(dir, re) {
  if (!existsSync(dir)) return []
  return (await readdir(dir)).filter((f) => re.test(f)).map((f) => f.replace(/\.json$/, '')).sort().reverse()
}

async function writeIndex(rankInfo) {
  const prev = await readJson(path.join(DATA, 'index.json'), {})
  const index = {
    site: '知知知识又又又增加了',
    updatedAt: new Date().toISOString(),
    rank: {
      months: await listJson(path.join(DATA, 'lm-rank'), /^\d{4}-\d{2}\.json$/),
      categories: rankInfo?.categories ?? prev.rank?.categories ?? ['text'],
    },
    v2ex: { dates: await listJson(path.join(DATA, 'v2ex'), /^\d{4}-\d{2}-\d{2}\.json$/) },
  }
  await writeJson(path.join(DATA, 'index.json'), index)
  console.log(`✓ 索引：榜单 ${index.rank.months.length} 个月 / V2EX ${index.v2ex.dates.length} 天`)
}

/* ------------------------------------------------------------------ */

const tasks = [
  ['大模型榜单', updateRank],
  ['V2EX 热议', updateV2ex],
  ['开源月刊', updatePeriodical],
]

let rankInfo = null
let failed = 0
for (const [name, fn] of tasks) {
  try {
    const r = await fn()
    if (fn === updateRank) rankInfo = r
  } catch (err) {
    failed += 1
    console.error(`✗ ${name} 抓取失败（保留旧数据）：${err.message}`)
  }
}
await writeIndex(rankInfo)

// 全部失败才算失败（让 Actions 标红提醒）；部分失败照常发布旧数据
if (failed === tasks.length) process.exit(1)
