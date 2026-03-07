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

  const allPostsData: PostMeta[] = [];

  // 读取 posts 目录下的所有条目
  const entries = fs.readdirSync(postsDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(postsDirectory, entry.name);

    if (entry.isDirectory()) {
      // 检查子目录中是否有 .md 文件
      const dirFiles = fs.readdirSync(fullPath);
      const mdFile = dirFiles.find(f => f.endsWith('.md'));

      if (mdFile) {
        const fileContents = fs.readFileSync(path.join(fullPath, mdFile), 'utf8');
        const { data } = matter(fileContents);

        // slug 就是目录名
        allPostsData.push({
          slug: entry.name,
          title: data.title || entry.name,
          date: data.date || new Date().toISOString(),
          updated: data.updated,
          tags: data.tags || [],
          description: data.description || '',
        });
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // 直接在 posts 目录下的 .md 文件
      const fileName = entry.name;
      const slug = fileName.replace(/\.md$/, '');
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      allPostsData.push({
        slug,
        title: data.title || slug,
        date: data.date || new Date().toISOString(),
        updated: data.updated,
        tags: data.tags || [],
        description: data.description || '',
      });
    }
  }

  return allPostsData.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

// 检查文章是否有 assets 目录
export function postHasAssets(slug: string): boolean {
  // 首先检查是否是子目录文章
  const subDirPath = path.join(postsDirectory, slug);
  if (fs.existsSync(subDirPath)) {
    const assetsPath = path.join(subDirPath, 'assets');
    return fs.existsSync(assetsPath) && fs.statSync(assetsPath).isDirectory();
  }

  // 检查直接在 posts 目录下的文章的 assets
  const mdFilePath = path.join(postsDirectory, `${slug}.md`);
  if (fs.existsSync(mdFilePath)) {
    const assetsPath = path.join(postsDirectory, slug, 'assets');
    return false; // 直接在 posts 目录下的文章不使用 assets
  }

  return false;
}

// 获取文章的 assets 路径
export function getPostAssetsPath(slug: string): string | null {
  const subDirPath = path.join(postsDirectory, slug);
  if (fs.existsSync(subDirPath)) {
    const assetsPath = path.join(subDirPath, 'assets');
    if (fs.existsSync(assetsPath) && fs.statSync(assetsPath).isDirectory()) {
      return assetsPath;
    }
  }
  return null;
}

// 根据 slug 获取单篇文章
export function getPostBySlug(slug: string): Post | null {
  try {
    // 首先尝试在子目录中查找
    const subDirPath = path.join(postsDirectory, slug);
    if (fs.existsSync(subDirPath) && fs.statSync(subDirPath).isDirectory()) {
      const dirFiles = fs.readdirSync(subDirPath);
      const mdFile = dirFiles.find(f => f.endsWith('.md'));

      if (mdFile) {
        const fullPath = path.join(subDirPath, mdFile);
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
      }
    }

    // 然后尝试直接查找 .md 文件
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
