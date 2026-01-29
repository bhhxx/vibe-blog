export interface SiteConfig {
  // 网站基本信息
  title: string;
  description: string;
  author: string;
  url: string;

  // 社交链接
  links: {
    github?: string;
    email?: string;
    twitter?: string;
    weibo?: string;
    zhihu?: string;
  };

  // Giscus 评论配置
  giscus: {
    repo: string;
    repoId: string;
    category: string;
    categoryId: string;
    mapping: 'pathname' | 'url' | 'title' | 'og:title' | 'custom';
    reactionsEnabled: boolean;
    inputPosition: 'top' | 'bottom';
    theme: 'light' | 'dark' | 'dark_dimmed' | 'dark_high_contrast' | 'dark_tritanopia' | 'light_high_contrast' | 'light_tritanopia' | 'preferred_color_scheme';
    lang: string;
  };

  // 首页欢迎语
  greeting: {
    title: string;
    subtitle: string;
  };
}
