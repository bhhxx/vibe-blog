export const siteConfig = {
  title: "BHHXX's Blog",
  description: "极简个人博客",
  author: "bhhxx",
  url: "https://bhhxx.wiki",
  links: {
    github: "https://github.com/bhhxx",
    email: "mailto:hi@bhhxx.wiki",
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
};
