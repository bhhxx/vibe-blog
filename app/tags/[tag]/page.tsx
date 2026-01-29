import { getPostsByTag, getAllTags } from '@/lib/posts';
import { PostCard } from '@/components/PostCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map(({ tag }) => ({
    tag: tag,
  }));
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: encodedTag } = await params;
  // Next.js 会自动解码 URL 参数，但如果是双重编码需要处理
  const tag = decodeURIComponent(encodedTag);
  const posts = getPostsByTag(tag);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/tags" className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors inline-flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>返回标签列表</span>
        </Link>
      </div>

      <div className="mb-8 flex items-center gap-3">
        <span className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-lg text-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
          {tag}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          {posts.length} 篇文章
        </span>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
