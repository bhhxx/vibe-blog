'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { SearchButton } from './SearchButton';

interface HeaderClientProps {
  posts: Array<{
    slug: string;
    title: string;
    description: string;
    tags: string[];
  }>;
}

export function HeaderClient({ posts }: HeaderClientProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/archive', label: '归档' },
    { href: '/tags', label: '标签' },
    { href: '/about', label: '关于' },
    { href: '/links', label: '友链' },
  ];

  return (
    <header className="border-b dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            BHHXX
          </Link>

          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm hover:text-gray-600 dark:hover:text-gray-400 ${
                  pathname === item.href
                    ? 'font-bold'
                    : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            <SearchButton posts={posts} />
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
