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
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← 返回首页
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <time>{new Date(post.date).toLocaleDateString('zh-CN')}</time>
          {post.tags.length > 0 && (
            <>
              <span>·</span>
              <div className="flex gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${tag}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    #{tag}
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
