import Link from 'next/link';
import { PostMeta } from '@/lib/posts';

interface PostCardProps {
  post: PostMeta;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="py-4">
      <Link href={`/post/${post.slug}`}>
        <h2 className="text-xl font-bold hover:text-blue-600 dark:hover:text-blue-400">
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
                  className="hover:text-blue-600 dark:hover:text-blue-400"
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
