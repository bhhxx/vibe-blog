import { links } from '@/data/links';

export default function LinksPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">友链</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 border border-gray-300 dark:border-gray-800 rounded-lg hover:border-black dark:hover:border-white transition"
          >
            <div className="font-bold text-lg text-gray-700 dark:text-gray-200">{link.name}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {link.description}
            </div>
          </a>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h2 className="font-bold mb-2">申请友链</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          如果你想交换友链，请在评论区留言，格式如下：
        </p>
        <pre className="mt-2 text-sm">
          {`名称: 你的网站名称
网址: https://yourwebsite.com
描述: 一句话描述你的网站`}
        </pre>
      </div>
    </div>
  );
}
