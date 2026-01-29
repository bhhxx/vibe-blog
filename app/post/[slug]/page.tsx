import { getPostBySlug, getAllPosts } from '@/lib/posts';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import Link from 'next/link';
import { Giscus } from '@/components/Giscus';
import { CodeBlock } from '@/components/CodeBlock';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-3xl">
      <div className="mb-8">
        <Link
          href="/"
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors inline-flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>返回首页</span>
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <time>发布于 {new Date(post.date).toLocaleDateString('zh-CN')}</time>
          {post.updated && (
            <>
              <span>·</span>
              <time>更新于 {new Date(post.updated).toLocaleDateString('zh-CN')}</time>
            </>
          )}
          {post.tags.length > 0 && (
            <>
              <span>·</span>
              <div className="flex gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${tag}`}
                    className="px-2 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h1: ({ children }) => null, // 隐藏文章中的 H1 标题，避免重复
            pre: ({ node, children, ...props }: any) => (
              <CodeBlock {...props}>
                {children}
              </CodeBlock>
            ),
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      <Giscus />
    </article>
  );
}
