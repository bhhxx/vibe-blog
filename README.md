# BHHXX's Blog

一个极简的个人博客，使用 Next.js + TypeScript + TailwindCSS 构建。

## 特性

- ✅ Markdown 写作，支持代码高亮
- ✅ 标签分类和归档
- ✅ 深色模式
- ✅ 全文搜索
- ✅ 响应式设计
- ✅ 静态导出，可部署到任意静态托管平台

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS
- **内容**: Markdown (gray-matter + react-markdown)

## 项目架构

```
blog/
├── app/              # 页面（Next.js App Router）
├── components/       # React 组件
├── lib/             # 工具函数（文章处理）
├── posts/           # Markdown 文章
├── data/            # 数据文件（关于、友链）
└── config/          # 站点配置
```

### 架构说明

- **静态生成**: 构建后生成纯 HTML 文件，无需服务器
- **组件分离**: 服务器组件（数据）+ 客户端组件（交互）
- **文件路由**: 基于 Next.js App Router 的文件系统路由
- **本地优先**: 本地 Markdown 文件，Git 版本控制

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

## 写文章

在 `posts/` 目录创建 Markdown 文件：

```markdown
---
title: "文章标题"
date: 2024-01-28
tags: ["标签1", "标签2"]
description: "文章摘要"
---

# 文章标题

正文内容...
```

文件命名格式：`YYYY-MM-DD-标题.md`

## 自定义配置

- **站点信息**: `config/site.ts`
- **关于页面**: `data/about.md`
- **友链**: `data/links.ts`

## 构建和部署

```bash
# 构建（生成 out/ 目录）
npm run build

# 启动生产服务器（预览）
npm run start
```

### 部署到腾讯云

1. 构建项目：`npm run build`
2. 将 `out/` 目录上传到腾讯云 COS
3. 配置静态网站托管
4. 绑定域名 `bhhxx.wiki`

## 常用命令

```bash
npm run dev      # 开发服务器
npm run build    # 构建静态文件
npm run start    # 预览生产构建
npm run lint     # 代码检查
```

## 项目结构

```
blog/
├── app/                    # Next.js 页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── archive/page.tsx   # 归档
│   ├── tags/page.tsx      # 标签列表
│   ├── tags/[tag]/page.tsx# 标签详情
│   ├── about/page.tsx     # 关于
│   ├── links/page.tsx     # 友链
│   └── post/[slug]/page.tsx # 文章详情
├── components/             # React 组件
│   ├── Header.tsx         # 头部（服务器）
│   ├── HeaderClient.tsx   # 头部（客户端）
│   ├── Footer.tsx         # 页脚
│   ├── PostCard.tsx       # 文章卡片
│   ├── ThemeToggle.tsx    # 主题切换
│   ├── SearchButton.tsx   # 搜索
│   ├── ThemeProvider.tsx  # 主题提供者
│   └── Giscus.tsx         # 评论组件
├── lib/                    # 工具函数
│   └── posts.ts           # 文章读取和处理
├── posts/                  # Markdown 文章
├── data/                   # 数据文件
│   ├── about.md          # 关于内容
│   └── links.ts          # 友链数据
├── config/                 # 配置
│   └── site.ts           # 站点配置
└── styles/                # 样式
    └── globals.css      # 全局样式
```

## 功能说明

- **首页**: 显示最新文章列表
- **归档**: 按年份分组展示所有文章
- **标签**: 标签云和标签详情页
- **关于**: 个人介绍
- **友链: 友情链接展示
- **搜索**: 基于 Fuse.js 的模糊搜索
- **深色模式**: 支持浅色/深色主题切换
- **评论**: 基于 Giscus（需配置）

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 在浏览器中打开 http://localhost:3000
```

## 修改博客配置

1. 修改站点信息：编辑 `config/site.ts`
2. 修改关于页面：编辑 `data/about.md`
3. 添加友链：编辑 `data/links.ts`
4. 配置评论：编辑 `components/Giscus.tsx`

## License

MIT

---

Made with Next.js + TypeScript + TailwindCSS
