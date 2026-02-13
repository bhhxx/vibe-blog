import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { siteConfig } from '@/config/site';

export default function AboutPage() {
  const aboutContent = `
你好！我是 ${siteConfig.author}。

这是我的个人博客，记录我的学习和生活。

## 博客名由来

高中的我曾取名“学习学不死，就往死里学”，大学后，厌倦课内应试教育，故**不好好学习**课内知识。但我依然热爱学习，喜欢探索各种新知识、新技能。


## 联系方式

${siteConfig.links.github ? `- GitHub: [${siteConfig.author}](${siteConfig.links.github})` : ''}
${siteConfig.links.email ? `- Email: ${siteConfig.links.email.replace('mailto:', '')}` : ''}
`;

  const wechatSection = siteConfig.wechat?.qrCode ? `
## 公众号

欢迎关注我的公众号！

![公众号二维码](${siteConfig.wechat.qrCode})
` : '';

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">关于</h1>

      <article className="prose dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {aboutContent + wechatSection}
        </ReactMarkdown>
      </article>
    </div>
  );
}
