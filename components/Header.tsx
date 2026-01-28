import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { HeaderClient } from './HeaderClient';

export function Header() {
  const posts = getAllPosts();

  return <HeaderClient posts={posts} />;
}
