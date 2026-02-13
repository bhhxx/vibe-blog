'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { CodeBlock } from './CodeBlock';
import { MermaidDiagram } from './MermaidDiagram';

interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  // 解析内容，提取标题并生成编号
  const { numberedContent } = useMemo(() => {
    const lines = content.split('\n');
    let h2Count = 0;
    const h3Counters: { [key: number]: number } = {}; // h2编号 -> h3计数
    const h4Counters: { [key: string]: number } = {}; // h2.h3编号 -> h4计数
    const h5Counters: { [key: string]: number } = {}; // h2.h3.h4编号 -> h5计数
    const h6Counters: { [key: string]: number } = {}; // h2.h3.h4.h5编号 -> h6计数

    const newLines = lines.map((line) => {
      const h2Match = line.match(/^##\s+(.*)/);
      const h3Match = line.match(/^###\s+(.*)/);
      const h4Match = line.match(/^####\s+(.*)/);
      const h5Match = line.match(/^#####\s+(.*)/);
      const h6Match = line.match(/^######\s+(.*)/);

      if (h2Match) {
        h2Count++;
        h3Counters[h2Count] = 0;
        return `## ${h2Count}. ${h2Match[1]}`;
      }

      if (h3Match) {
        h3Counters[h2Count]++;
        const h3Num = h3Counters[h2Count];
        h4Counters[`${h2Count}.${h3Num}`] = 0;
        return `### ${h2Count}.${h3Num} ${h3Match[1]}`;
      }

      if (h4Match) {
        const h3Num = h3Counters[h2Count];
        h4Counters[`${h2Count}.${h3Num}`]++;
        const h4Num = h4Counters[`${h2Count}.${h3Num}`];
        h5Counters[`${h2Count}.${h3Num}.${h4Num}`] = 0;
        return `#### ${h2Count}.${h3Num}.${h4Num} ${h4Match[1]}`;
      }

      if (h5Match) {
        const h3Num = h3Counters[h2Count];
        const h4Num = h4Counters[`${h2Count}.${h3Num}`];
        h5Counters[`${h2Count}.${h3Num}.${h4Num}`]++;
        const h5Num = h5Counters[`${h2Count}.${h3Num}.${h4Num}`];
        h6Counters[`${h2Count}.${h3Num}.${h4Num}.${h5Num}`] = 0;
        return `##### ${h2Count}.${h3Num}.${h4Num}.${h5Num} ${h5Match[1]}`;
      }

      if (h6Match) {
        const h3Num = h3Counters[h2Count];
        const h4Num = h4Counters[`${h2Count}.${h3Num}`];
        const h5Num = h5Counters[`${h2Count}.${h3Num}.${h4Num}`];
        h6Counters[`${h2Count}.${h3Num}.${h4Num}.${h5Num}`]++;
        const h6Num = h6Counters[`${h2Count}.${h3Num}.${h4Num}.${h5Num}`];
        return `###### ${h2Count}.${h3Num}.${h4Num}.${h5Num}.${h6Num} ${h6Match[1]}`;
      }

      return line;
    });

    return { numberedContent: newLines.join('\n') };
  }, [content]);

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          h1: ({ children }) => null,
          h2: ({ children, ...props }: any) => (
            <h2 {...props} id={children?.toString().replace(/^\d+\.\s*/, '').replace(/\s+/g, '-').toLowerCase()}>
              <a href={`#${children?.toString().replace(/^\d+\.\s*/, '').replace(/\s+/g, '-').toLowerCase()}`} className="no-underline">
                {children}
              </a>
            </h2>
          ),
          h3: ({ children, ...props }: any) => (
            <h3 {...props} id={children?.toString().replace(/\d+\.\d+\s/, '').replace(/\s+/g, '-').toLowerCase()}>
              <a href={`#${children?.toString().replace(/\d+\.\d+\s/, '').replace(/\s+/g, '-').toLowerCase()}`} className="no-underline">
                {children}
              </a>
            </h3>
          ),
          h4: ({ children, ...props }: any) => (
            <h4 {...props} id={children?.toString().replace(/\d+\.\d+\.\d+\s/, '').replace(/\s+/g, '-').toLowerCase()}>
              <a href={`#${children?.toString().replace(/\d+\.\d+\.\d+\s/, '').replace(/\s+/g, '-').toLowerCase()}`} className="no-underline">
                {children}
              </a>
            </h4>
          ),
          h5: ({ children, ...props }: any) => (
            <h5 {...props} id={children?.toString().replace(/\d+\.\d+\.\d+\.\d+\s/, '').replace(/\s+/g, '-').toLowerCase()}>
              <a href={`#${children?.toString().replace(/\d+\.\d+\.\d+\.\d+\s/, '').replace(/\s+/g, '-').toLowerCase()}`} className="no-underline">
                {children}
              </a>
            </h5>
          ),
          h6: ({ children, ...props }: any) => (
            <h6 {...props} id={children?.toString().replace(/\d+\.\d+\.\d+\.\d+\.\d+\s/, '').replace(/\s+/g, '-').toLowerCase()}>
              <a href={`#${children?.toString().replace(/\d+\.\d+\.\d+\.\d+\.\d+\s/, '').replace(/\s+/g, '-').toLowerCase()}`} className="no-underline">
                {children}
              </a>
            </h6>
          ),
          pre: ({ node, children, ...props }: any) => {
            // Check if this is a mermaid code block
            const codeElement = (children as any)?.[0];
            const isMermaid = props?.className?.includes('language-mermaid') ||
                            props?.className?.includes('mermaid') ||
                            codeElement?.props?.className?.includes('language-mermaid') ||
                            codeElement?.props?.className?.includes('mermaid');

            if (isMermaid) {
              const mermaidCode = codeElement?.props?.children;
              if (mermaidCode) {
                return <MermaidDiagram chart={mermaidCode} />;
              }
            }

            return (
              <CodeBlock {...props}>
                {children}
              </CodeBlock>
            );
          },
          img: ({ src, alt, width }: any) => (
            <img src={src} alt={alt} style={{ maxWidth: width || '100%' }} />
          ),
        }}
      >
        {numberedContent}
      </ReactMarkdown>

      <style jsx>{`
        .no-underline {
          text-decoration: none;
          color: inherit;
        }
      `}</style>
    </div>
  );
}
