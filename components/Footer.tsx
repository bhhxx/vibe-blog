import { siteConfig } from '@/config/site';

export function Footer() {
  return (
    <footer className="border-t border-gray-300 dark:border-gray-800 mt-12">
      <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>© {new Date().getFullYear()} {siteConfig.author}. All rights reserved.</p>
      </div>
    </footer>
  );
}
