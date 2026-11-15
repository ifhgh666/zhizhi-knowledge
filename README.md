# 知知知识又又又增加了

纯静态知识聚合网页，每日由 GitHub Actions 自动抓取并发布到 GitHub Pages。

## 内容板块

- **大模型榜单**：来自 [HelloGitHub 大模型排名](https://hellogithub.com/report/lm-rank)，涵盖文本、编程与 Web、多模态视觉、文生图、文生视频 5 个赛道，按月翻页。
- **V2EX 热议**：来自 [V2EX 热门讨论](https://www.v2ex.com/?tab=hot)，每日保留一份快照，支持按节点筛选与按日回看。
- **开源月刊**：来自 [HelloGitHub 月刊 RSS](https://hellogithub.com/rss)，展示每期开源项目数、分类分布与原文链接。

## 本地运行

```bash
npm install
npm run fetch   # 抓取最新数据到 public/data/
npm run dev     # 本地预览
npm run build   # 构建静态文件到 dist/
```
