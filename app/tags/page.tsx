import { getAllTags } from '@/lib/posts';
import Link from 'next/link';

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">标签</h1>

      {tags.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">还没有标签</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              <span className="font-medium">{tag}</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
