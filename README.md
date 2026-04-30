# BHHXX's Blog

一个极简的个人博客，使用 Next.js + TypeScript + TailwindCSS 构建，纯静态导出，可部署到任意静态托管平台。

## 特性

- Markdown 写作，支持代码高亮、数学公式 (KaTeX)、Mermaid 图表
- 标签分类和归档
- 深色模式
- 基于 Fuse.js 的全文搜索
- 响应式设计，移动端适配
- 自动标题编号 + 响应式 TOC 大纲
- Giscus 评论系统
- 静态导出，无需服务器

## 技术栈

- **框架**: Next.js 16 (App Router, `output: 'export'`)
- **语言**: TypeScript
- **样式**: TailwindCSS 3 + @tailwindcss/typography
- **内容**: Markdown (gray-matter + react-markdown)
- **搜索**: Fuse.js
- **评论**: Giscus (GitHub Discussions)

## 项目架构

```
blog/
├── app/                    # Next.js App Router 页面
│   ├── layout.tsx          # 根布局: ThemeProvider + Header + Footer
│   ├── page.tsx            # 首页: 文章列表
│   ├── archive/page.tsx    # 归档: 按年份分组
│   ├── tags/page.tsx       # 标签列表: 标签云
│   ├── tags/[tag]/page.tsx # 标签详情: 该标签下的文章
│   ├── about/page.tsx      # 关于: 内联 Markdown 渲染
│   ├── links/page.tsx      # 友链: 友链列表 + Giscus 评论
│   └── post/[slug]/page.tsx# 文章详情: 核心页面
├── components/             # React 组件
│   ├── Header.tsx          # 服务器组件 -- 获取文章数据
│   ├── HeaderClient.tsx    # 客户端组件 -- 导航栏 UI
│   ├── Footer.tsx          # 服务器组件 -- 页脚
│   ├── PostCard.tsx        # 服务器组件 -- 文章卡片
│   ├── ArticleContent.tsx  # 客户端组件 -- 文章渲染核心 (TOC, 编号, Markdown)
│   ├── CodeBlock.tsx       # 客户端组件 -- 代码块 (复制按钮)
│   ├── MermaidDiagram.tsx  # 客户端组件 -- Mermaid 图表
│   ├── Giscus.tsx          # 客户端组件 -- 评论系统
│   ├── SearchButton.tsx    # 客户端组件 -- 全文搜索
│   ├── ThemeProvider.tsx   # 客户端组件 -- 主题 Provider
│   └── ThemeToggle.tsx     # 客户端组件 -- 主题切换
├── lib/
│   └── posts.ts            # 核心数据层: 文章读取、解析、查询
├── config/
│   ├── site.ts             # 站点配置实例
│   ├── site.example.ts     # 配置模板 (带注释)
│   └── types.ts            # SiteConfig 类型定义
├── data/
│   └── links.ts            # 友链数据
├── posts/                  # Markdown 文章 (支持两种格式)
│   ├── YYYY-MM-DD-slug.md          # 扁平文件 (纯文本文章)
│   └── YYYY-MM-DD-slug/            # 子目录 (含图片资源)
│       ├── YYYY-MM-DD-slug.md
│       └── assets/                  # 图片等资源
├── scripts/
│   └── copy-post-assets.js # 构建后复制文章资源到 out/
├── public/                 # 静态资源 (favicon 等)
├── styles/
│   └── globals.css         # 全局样式 (代码高亮、暗色变量)
├── deploy.sh               # Linux 部署脚本
└── deploy.bat              # Windows 部署脚本
```

### 架构特点

1. **纯静态博客**: `output: 'export'` 模式，构建产物为纯 HTML/CSS/JS
2. **文件系统驱动**: 所有数据来自 `posts/` 目录，无数据库、无 CMS
3. **服务端/客户端分离**: 服务器组件负责数据获取，客户端组件负责交互
4. **构建时静态生成**: `generateStaticParams` 预渲染所有文章和标签页
5. **丰富的 Markdown**: GFM 表格、KaTeX 数学公式、代码高亮、Mermaid 图表

### 核心数据层 (`lib/posts.ts`)

| 函数 | 作用 | 返回值 |
|------|------|--------|
| `getAllPosts()` | 读取所有文章元数据，按日期降序 | `PostMeta[]` |
| `getPostBySlug(slug)` | 根据 slug 获取完整文章 | `Post \| null` |
| `getAllTags()` | 统计所有标签及文章数量 | `{ tag, count }[]` |
| `getPostsByTag(tag)` | 获取指定标签下的文章 | `PostMeta[]` |
| `getPostsByYear()` | 按年份分组文章 | `Record<string, PostMeta[]>` |

文章路径解析: 先尝试 `posts/{slug}/xxx.md`（子目录），再尝试 `posts/{slug}.md`（扁平文件）。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

## 写文章

### 扁平文件 (纯文本文章)

在 `posts/` 目录创建 Markdown 文件:

```
posts/2026-05-01-my-article.md
```

### 子目录 (含图片资源)

```
posts/2026-05-01-my-article/
├── 2026-05-01-my-article.md
└── assets/
    └── image.png
```

Markdown 中引用图片: `![alt](assets/image.png)`

### Frontmatter 格式

```markdown
---
title: "文章标题"
date: 2026-05-01
tags: ["标签1", "标签2"]
description: "文章摘要"
toc: true          # 可选: 强制显示大纲 (省略时按标题数量自动决定)
tocDepth: 3        # 可选: 大纲显示到几级标题，默认 3
updated: 2026-05-02 # 可选: 最后更新日期
---

# 文章标题

正文内容...
```

## 配置

| 文件 | 用途 |
|------|------|
| `config/site.ts` | 站点信息、社交链接、评论配置、首页欢迎语 |
| `config/site.example.ts` | 配置模板，带详细注释 |
| `data/links.ts` | 友链数据 |
| `components/Giscus.tsx` | 评论系统配置 |

## 构建和部署

```bash
# 构建静态文件 (生成 out/ 目录)
npm run build

# 启动生产服务器 (本地预览)
npm run start
```

### 部署到腾讯云

```bash
# Linux
./deploy.sh

# Windows
deploy.bat
```

脚本会自动: 构建 -> 打包 -> SCP 上传 -> 服务器端解压 -> 设置权限。

## 常用命令

```bash
npm run dev      # 开发服务器
npm run build    # 构建静态文件
npm run start    # 预览生产构建
npm run lint     # 代码检查
```

## License

MIT

---

Made with Next.js + TypeScript + TailwindCSS
