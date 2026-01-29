import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { siteConfig } from '@/config/site';

export default function AboutPage() {
  const aboutContent = `
你好！我是 ${siteConfig.author}。

这是我的个人博客，记录我的学习和生活。

## 技术栈

这个博客使用以下技术构建：

- Next.js 15
- TypeScript
- TailwindCSS
- Markdown

## 联系方式

${siteConfig.links.github ? `- GitHub: [${siteConfig.author}](${siteConfig.links.github})` : ''}
${siteConfig.links.email ? `- Email: ${siteConfig.links.email.replace('mailto:', '')}` : ''}
`;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">关于</h1>

      <article className="prose dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {aboutContent}
        </ReactMarkdown>
      </article>
    </div>
  );
}
