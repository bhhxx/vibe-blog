'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';

interface Post {
  slug: string;
  title: string;
  description: string;
  tags?: string[];
}

interface SearchButtonProps {
  posts: Post[];
}

export function SearchButton({ posts }: SearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // 初始化 Fuse 索引
  const fuse = useMemo(() => {
    return new Fuse(posts, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'description', weight: 1.5 },
        { name: 'tags', weight: 1.5 },
      ],
      threshold: 0.3,
    });
  }, [posts]);

  // 点击外部关闭搜索框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim()) {
        const searchResults = fuse.search(query);
        setResults(searchResults.map((result) => result.item));
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, fuse]);

  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative" ref={searchRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        aria-label="Search"
      >
        搜索
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-lg shadow-lg p-4 z-50">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文章..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-black dark:focus:border-white transition"
            autoFocus
          />

          {query && results.length > 0 && (
            <div className="mt-4 max-h-64 overflow-y-auto">
              {results.map((post) => (
                <Link
                  key={post.slug}
                  href={`/post/${post.slug}`}
                  onClick={closeSearch}
                  className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <div className="font-medium">{post.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {post.description}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
              未找到相关文章
            </div>
          )}
        </div>
      )}
    </div>
  );
}
