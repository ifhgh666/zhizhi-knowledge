let cachedPromise = null

export async function loadBlog() {
  if (!cachedPromise) {
    cachedPromise = fetch('./data/blog.json').then(async (res) => {
      if (!res.ok) throw new Error(`读取博客数据失败 (${res.status})`)
      return res.json()
    })
  }
  return cachedPromise
}

/** 轻量 Markdown 渲染（支持 ## 标题、代码块、行内代码、加粗、列表、链接、图片与段落） */
export function renderMarkdown(md) {
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const codeBlocks = []
  let text = String(md ?? '').replace(/\r\n/g, '\n')

  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length
    codeBlocks.push(
      `<pre class="md-pre"><code class="md-code" data-lang="${esc(lang)}">${esc(code.trimEnd())}</code></pre>`,
    )
    return `\n@@CODE_${idx}@@\n`
  })

  const inline = (line) =>
    esc(line)
      .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img class="md-img" src="$2" alt="$1" loading="lazy" />')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
      .replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  const blocks = text.split(/\n{2,}/)
  const html = blocks.map((raw) => {
    const b = raw.trim()
    if (!b) return ''
    const codeMatch = b.match(/^@@CODE_(\d+)@@$/)
    if (codeMatch) return codeBlocks[Number(codeMatch[1])]
    if (b.startsWith('### ')) return `<h3>${inline(b.slice(4))}</h3>`
    if (b.startsWith('## ')) return `<h2>${inline(b.slice(3))}</h2>`
    if (b.startsWith('# ')) return `<h1>${inline(b.slice(2))}</h1>`

    const lines = b.split('\n')
    if (lines.every((l) => /^(\d+\.|-|\*)\s+/.test(l.trim()))) {
      const isOl = /^\d+\.\s+/.test(lines[0].trim())
      const tag = isOl ? 'ol' : 'ul'
      const lis = lines
        .map((l) => `<li>${inline(l.trim().replace(/^(\d+\.|-|\*)\s+/, ''))}</li>`)
        .join('')
      return `<${tag}>${lis}</${tag}>`
    }
    return `<p>${lines.map(inline).join('<br/>')}</p>`
  })

  return html.join('\n')
}

export function issueNewUrl(repo, template) {
  const r = repo || 'ifhgh666/zhizhi-knowledge'
  return `https://github.com/${r}/issues/new?template=${encodeURIComponent(template)}`
}
