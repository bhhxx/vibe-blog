import { getPostsByYear } from '@/lib/posts';
import Link from 'next/link';

export default function ArchivePage() {
  const postsByYear = getPostsByYear();
  const years = Object.keys(postsByYear).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">归档</h1>

      {years.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">还没有发布文章</p>
      ) : (
        <div className="space-y-12">
          {years.map((year) => (
            <div key={year}>
              <h2 className="text-2xl font-bold mb-4">{year}</h2>
              <div className="space-y-3">
                {postsByYear[year].map((post) => (
                  <Link
                    key={post.slug}
                    href={`/post/${post.slug}`}
                    className="block transition-colors"
                  >
                    <div className="font-medium text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white">
                      {post.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(post.date).toLocaleDateString('zh-CN')}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
