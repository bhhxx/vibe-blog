import type { SiteConfig } from './types';

// 网站配置示例
// 复制此文件为 site.ts 并填入你的个人信息
export const siteConfig: SiteConfig = {
  // ==================== 基本信息配置 ====================
  title: "你的博客名称", // 例如: "张三的博客"
  description: "博客描述，会显示在搜索引擎和 meta 标签中", // 例如: "记录学习和生活的个人博客"
  author: "你的名字或用户名", // 例如: "zhangsan"
  url: "https://yourdomain.com", // 你的博客域名

  // ==================== 社交链接配置 ====================
  links: {
    github: "https://github.com/yourusername", // 你的 GitHub 主页
    email: "mailto:your@email.com", // 你的邮箱
    // 可选链接（删除不需要的）:
    // twitter: "https://twitter.com/yourusername",
    // weibo: "https://weibo.com/yourusername",
    // zhihu: "https://zhihu.com/people/yourusername",
  },

  // ==================== Giscus 评论配置 ====================
  // 访问 https://giscus.app 获取这些配置
  giscus: {
    repo: "yourusername/blog", // 你的 GitHub 仓库 (格式: username/repo)
    repoId: "", // 在 giscus.app 获取仓库 ID
    category: "Announcements", // 讨论分类名称
    categoryId: "", // 在 giscus.app 获取分类 ID
    mapping: "pathname", // 根据文章路径匹配评论
    reactionsEnabled: true, // 启用表情反应
    inputPosition: "bottom", // 评论框位置: 'top' | 'bottom'
    theme: "preferred_color_scheme", // 主题，推荐跟随系统
    lang: "zh-CN", // 语言: 'zh-CN' | 'en' | 'ja' 等
  },

  // ==================== 首页欢迎语配置 ====================
  greeting: {
    title: "你好，我是你的名字", // 首页大标题
    subtitle: "欢迎来到我的个人博客", // 首页副标题
  },
};
