import { getAllPosts } from '@/lib/posts';
import { PostCard } from '@/components/PostCard';

export default function Home() {
  const posts = getAllPosts();

  return (
    <div>
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-4">你好，我是 BHHXX</h1>
        <p className="text-xl text-gray-700 dark:text-gray-300">
          欢迎来到我的个人博客
        </p>
      </section>

      <section>
        {posts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            还没有发布文章
          </p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
