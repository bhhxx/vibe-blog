---
title: "使用 Next.js 构建博客"
date: 2024-01-15
tags: ["Next.js", "TypeScript", "TailwindCSS"]
description: "分享使用 Next.js 15 + TypeScript + TailwindCSS 构建个人博客的经验。"
---

# 使用 Next.js 构建博客

最近我使用 Next.js 15 重新构建了我的个人博客，这里分享一下经验。

## 为什么选择 Next.js？

Next.js 是一个强大的 React 框架，具有以下优势：

1. **静态生成**：预渲染页面，加载速度快
2. **零配置**：开箱即用的 TypeScript 支持
3. **文件路由**：基于文件系统的路由
4. **App Router**：最新的路由系统

## 技术栈

- **Next.js 15**：React 框架
- **TypeScript**：类型安全
- **TailwindCSS**：快速样式开发
- **gray-matter**：解析 Markdown frontmatter
- **react-markdown**：Markdown 渲染

## 项目结构

```
blog/
├── app/           # Next.js App Router
├── components/    # React 组件
├── lib/           # 工具函数
├── posts/         # Markdown 文章
└── data/          # 数据文件
```

## 总结

如果你也想构建一个个人博客，推荐试试 Next.js！
