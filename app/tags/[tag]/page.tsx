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
        <Link href="/tags" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← 返回标签列表
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">
        标签: #{tag}
        <span className="ml-2 text-lg text-gray-600 dark:text-gray-400">
          ({posts.length} 篇文章)
        </span>
      </h1>

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
