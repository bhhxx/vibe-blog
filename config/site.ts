import type { SiteConfig } from './types';

export const siteConfig: SiteConfig = {
  title: "BHHXX's Blog", // 网站标题
  description: "极简个人博客", // 网站描述
  author: "bhhxx", // 作者名称
  url: "https://bhhxx.wiki", // 网站 URL
  links: { // 社交链接
    github: "https://github.com/bhhxx",
    email: "mailto:1640680356@qq.com",
  },
  // giscus 评论配置
  giscus: {
    repo: "bhhxx/blog", // 你的 GitHub 仓库
    repoId: "", // 在 giscus.app 获取
    category: "Announcements",
    categoryId: "", // 在 giscus.app 获取
    mapping: "pathname",
    reactionsEnabled: true,
    inputPosition: "bottom",
    theme: "preferred_color_scheme",
    lang: "zh-CN",
  },
  // 首页欢迎语
  greeting: {
    title: "你好，我是 BHHXX", // 标题
    subtitle: "欢迎来到我的个人博客", // 副标题
  },
};
