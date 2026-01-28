import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'posts');

export interface Post {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  tags: string[];
  description: string;
  content: string;
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  tags: string[];
  description: string;
}

// 获取所有文章的元数据
export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        title: data.title || slug,
        date: data.date || new Date().toISOString(),
        updated: data.updated,
        tags: data.tags || [],
        description: data.description || '',
      } as PostMeta;
    });

  return allPostsData.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

// 根据 slug 获取单篇文章
export function getPostBySlug(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || slug,
      date: data.date || new Date().toISOString(),
      updated: data.updated,
      tags: data.tags || [],
      description: data.description || '',
      content,
    };
  } catch {
    return null;
  }
}

// 获取所有标签
export function getAllTags(): { tag: string; count: number }[] {
  const posts = getAllPosts();
  const tagMap = new Map<string, number>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// 根据标签获取文章
export function getPostsByTag(tag: string): PostMeta[] {
  const posts = getAllPosts();
  return posts.filter((post) => post.tags.includes(tag));
}

// 按年份分组文章
export function getPostsByYear(): Record<string, PostMeta[]> {
  const posts = getAllPosts();
  const postsByYear: Record<string, PostMeta[]> = {};

  posts.forEach((post) => {
    const year = new Date(post.date).getFullYear().toString();
    if (!postsByYear[year]) {
      postsByYear[year] = [];
    }
    postsByYear[year].push(post);
  });

  return postsByYear;
}
