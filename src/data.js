const cache = new Map()

async function fetchJson(relPath) {
  if (cache.has(relPath)) return cache.get(relPath)
  const p = fetch(`./data/${relPath}`).then(async (res) => {
    if (!res.ok) throw new Error(`读取数据失败 (${res.status})：${relPath}`)
    return res.json()
  })
  cache.set(relPath, p)
  try {
    return await p
  } catch (err) {
    cache.delete(relPath)
    throw err
  }
}

export const RANK_CATEGORY_LABEL = {
  text: '文本模型',
  webdev: '编程与 Web',
  vision: '多模态视觉',
  'text-to-image': '文生图',
  'text-to-video': '文生视频',
}

export function categoryLabel(key) {
  return RANK_CATEGORY_LABEL[key] ?? key
}

export const dataApi = {
  index: () => fetchJson('index.json'),
  rankMonth: (month) => fetchJson(`lm-rank/${month}.json`),
  v2exDay: (date) => fetchJson(`v2ex/${date}.json`),
  periodical: () => fetchJson('periodical.json'),
}

export function formatTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateOnly(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(d)
}

export function formatMonthLabel(ym) {
  const [y, m] = String(ym).split('-')
  if (!y || !m) return ym
  return `${y} 年 ${Number(m)} 月`
}
