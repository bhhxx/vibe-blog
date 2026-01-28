import Link from 'next/link';
import { PostMeta } from '@/lib/posts';

interface PostCardProps {
  post: PostMeta;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="py-4">
      <Link href={`/post/${post.slug}`}>
        <h2 className="text-xl font-bold text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors">
          {post.title}
        </h2>
      </Link>

      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
        <time>{new Date(post.date).toLocaleDateString('zh-CN')}</time>
        {post.tags.length > 0 && (
          <>
            <span>·</span>
            <div className="flex gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {post.description && (
        <p className="mt-2 text-gray-700 dark:text-gray-300">
          {post.description}
        </p>
      )}
    </article>
  );
}
