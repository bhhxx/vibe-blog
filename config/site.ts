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
  // 公众号配置
  wechat: {
    qrCode: "/wechat-qr.jpg",
  },
  // giscus 评论配置
  giscus: {
    repo: "bhhxx/vibe-blog",
    repoId: "R_kgDORDivZw",
    category: "Announcements",
    categoryId: "DIC_kwDORDivZ84C1nAR",
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
