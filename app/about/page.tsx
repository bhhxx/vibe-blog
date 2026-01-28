import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export default function AboutPage() {
  const aboutPath = path.join(process.cwd(), 'data/about.md');
  const fileContents = fs.readFileSync(aboutPath, 'utf8');
  const { content } = matter(fileContents);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">关于</h1>

      <article className="prose dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
