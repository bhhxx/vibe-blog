'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { CodeBlock } from './CodeBlock';
import { MermaidDiagram } from './MermaidDiagram';

interface ArticleContentProps {
  content: string;
  toc?: boolean;
  tocDepth?: number;
}

interface HeadingItem {
  id: string;
  level: number;
  numberedTitle: string;
  rootId: string;
}

interface TocGroup {
  heading: HeadingItem;
  children: HeadingItem[];
}

function getHeadingId(text: string): string {
  return text
    .replace(/^\d+(?:\.\d+)*\.?\s*/, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function normalizeTocDepth(tocDepth?: number): number {
  if (!Number.isFinite(tocDepth)) {
    return 3;
  }

  return Math.min(6, Math.max(2, Math.floor(tocDepth as number)));
}

function getArticleHeadingClasses(level: number) {
  switch (level) {
    case 2:
      return 'scroll-mt-24 text-stone-950 dark:text-stone-100';
    case 3:
      return 'scroll-mt-24 text-sky-900 dark:text-sky-200';
    case 4:
      return 'scroll-mt-24 text-teal-800 dark:text-teal-200';
    case 5:
      return 'scroll-mt-24 text-amber-800 dark:text-amber-200';
    case 6:
      return 'scroll-mt-24 text-violet-800 dark:text-violet-200';
    default:
      return 'scroll-mt-24 text-slate-900 dark:text-slate-100';
  }
}

function buildTocGroups(headings: HeadingItem[]): TocGroup[] {
  const groups: TocGroup[] = [];
  let currentGroup: TocGroup | null = null;

  for (const heading of headings) {
    if (heading.level === 2 || currentGroup === null) {
      currentGroup = {
        heading,
        children: [],
      };
      groups.push(currentGroup);
      continue;
    }

    currentGroup.children.push(heading);
  }

  return groups;
}

function useActiveHeading(headings: HeadingItem[]) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (headings.length === 0) {
      setActiveId('');
      return;
    }

    const headingElements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null);

    if (headingElements.length === 0) {
      setActiveId('');
      return;
    }

    let frameId = 0;

    const updateActiveHeading = () => {
      frameId = 0;
      const threshold = 132;
      let nextActiveId = headingElements[0].id;

      for (const element of headingElements) {
        if (element.getBoundingClientRect().top - threshold <= 0) {
          nextActiveId = element.id;
        } else {
          break;
        }
      }

      const viewportBottom = window.scrollY + window.innerHeight;
      const documentBottom = document.documentElement.scrollHeight;
      if (documentBottom - viewportBottom < 96) {
        nextActiveId = headingElements[headingElements.length - 1].id;
      }

      setActiveId((currentActiveId) => (
        currentActiveId === nextActiveId ? currentActiveId : nextActiveId
      ));
    };

    const handleViewportChange = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(updateActiveHeading);
    };

    updateActiveHeading();

    window.addEventListener('scroll', handleViewportChange, { passive: true });
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('hashchange', handleViewportChange);

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('hashchange', handleViewportChange);
    };
  }, [headings]);

  return activeId;
}

function TableOfContentsLinks({
  groups,
  activeId,
  expandedRootId,
  onNavigate,
}: {
  groups: TocGroup[];
  activeId: string;
  expandedRootId?: string;
  onNavigate?: () => void;
}) {
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    if (!activeId) {
      return;
    }

    linkRefs.current[activeId]?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
  }, [activeId]);

  return (
    <nav aria-label="文章大纲">
      <ol className="space-y-2">
        {groups.map((group) => {
          const isExpanded = group.heading.id === expandedRootId;
          const isRootActive = activeId === group.heading.id;

          return (
            <li key={group.heading.id}>
              <a
                ref={(element) => {
                  linkRefs.current[group.heading.id] = element;
                }}
                href={`#${group.heading.id}`}
                aria-current={isRootActive ? 'location' : undefined}
                onClick={onNavigate}
                className={`block rounded-2xl px-3 py-2 text-sm font-medium leading-6 transition-all duration-200 ${
                  isRootActive
                    ? 'bg-stone-900 text-white shadow-[0_18px_35px_-30px_rgba(28,25,23,0.85)] dark:bg-slate-100 dark:text-slate-950'
                    : 'text-stone-700 hover:bg-stone-100/80 hover:text-stone-950 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-slate-100'
                }`}
              >
                {group.heading.numberedTitle}
              </a>

              {isExpanded && group.children.length > 0 && (
                <ol className="mt-2 space-y-1 border-l border-stone-200 pl-3 dark:border-slate-800">
                  {group.children.map((heading) => {
                    const depthOffset = (heading.level - 3) * 0.75;
                    const isActive = activeId === heading.id;

                    return (
                      <li key={heading.id}>
                        <a
                          ref={(element) => {
                            linkRefs.current[heading.id] = element;
                          }}
                          href={`#${heading.id}`}
                          aria-current={isActive ? 'location' : undefined}
                          onClick={onNavigate}
                          className={`group relative block rounded-xl py-1.5 pr-3 text-sm leading-6 transition-all duration-200 ${
                            isActive
                              ? 'bg-stone-100 text-stone-950 dark:bg-white/[0.06] dark:text-slate-100'
                              : 'text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                          style={{ paddingLeft: `${0.9 + depthOffset}rem` }}
                        >
                          <span
                            aria-hidden="true"
                            className={`absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full transition-colors ${
                              isActive
                                ? 'bg-stone-900 dark:bg-slate-100'
                                : 'bg-stone-300 group-hover:bg-stone-500 dark:bg-slate-700 dark:group-hover:bg-slate-500'
                            }`}
                            style={{ left: `${0.35 + depthOffset}rem` }}
                          />
                          {heading.numberedTitle}
                        </a>
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function MobileTableOfContents({
  groups,
  activeId,
  expandedRootId,
  currentHeading,
  isHidden,
  onToggleHidden,
}: {
  groups: TocGroup[];
  activeId: string;
  expandedRootId?: string;
  currentHeading?: HeadingItem;
  isHidden: boolean;
  onToggleHidden: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const sectionCount = groups.reduce((count, group) => count + 1 + group.children.length, 0);

  useEffect(() => {
    if (isHidden) {
      setIsOpen(false);
    }
  }, [isHidden]);

  if (groups.length === 0) {
    return null;
  }

  if (isHidden) {
    return null;
  }

  return (
    <div className="not-prose mb-6 xl:hidden">
      <div className="overflow-hidden rounded-[1.75rem] border border-stone-200/80 bg-white/80 shadow-[0_24px_50px_-40px_rgba(28,25,23,0.45)] backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-950/70 dark:shadow-[0_24px_50px_-38px_rgba(2,6,23,0.85)]">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500 dark:text-slate-500">
              文章大纲
            </p>
            <p className="mt-1 text-sm font-medium text-stone-900 dark:text-slate-100">
              {currentHeading?.numberedTitle ?? `${sectionCount} 个章节`}
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
              点击后可快速跳到对应章节
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="rounded-full border border-stone-200/90 bg-white/80 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-white dark:border-slate-700/90 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {isOpen ? '收起' : '展开'}
            </button>
            <button
              type="button"
              onClick={onToggleHidden}
              className="rounded-full border border-transparent bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-stone-700 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
            >
              隐藏
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="border-t border-stone-200/80 px-3 py-3 dark:border-slate-800/90">
            <TableOfContentsLinks
              groups={groups}
              activeId={activeId}
              expandedRootId={expandedRootId}
              onNavigate={() => setIsOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DesktopTableOfContents({
  groups,
  activeId,
  expandedRootId,
  currentHeading,
  onToggleHidden,
}: {
  groups: TocGroup[];
  activeId: string;
  expandedRootId?: string;
  currentHeading?: HeadingItem;
  onToggleHidden: () => void;
}) {
  const sectionCount = groups.reduce((count, group) => count + 1 + group.children.length, 0);

  if (groups.length === 0) {
    return null;
  }

  return (
    <aside className="not-prose fixed left-[calc(50%+22rem)] top-1/2 z-30 hidden -translate-y-1/2 xl:block 2xl:left-[calc(50%+22.5rem)]">
      <div className="flex h-[30rem] w-60 flex-col overflow-hidden rounded-[1.9rem] border border-stone-200/85 bg-white/78 p-4 shadow-[0_28px_70px_-44px_rgba(28,25,23,0.52)] backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-950/72 dark:shadow-[0_28px_80px_-42px_rgba(2,6,23,0.92)] 2xl:h-[32rem] 2xl:w-64">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500 dark:text-slate-500">
              文章大纲
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-stone-900 dark:text-slate-100">
              {currentHeading?.numberedTitle ?? '快速跳转到文章章节'}
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
              {sectionCount} 个章节
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleHidden}
            className="rounded-full border border-stone-200/90 bg-white/85 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-white dark:border-slate-700/90 dark:bg-slate-900/85 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            隐藏
          </button>
        </div>

        <div className="mt-4 h-px bg-gradient-to-r from-stone-300/75 via-stone-200/65 to-transparent dark:from-slate-700/90 dark:via-slate-800/70 dark:to-transparent" />

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <TableOfContentsLinks
            groups={groups}
            activeId={activeId}
            expandedRootId={expandedRootId}
          />
        </div>
      </div>
    </aside>
  );
}

function DesktopTableOfContentsTrigger({
  currentHeading,
  onShow,
}: {
  currentHeading?: HeadingItem;
  onShow: () => void;
}) {
  return (
    <div className="not-prose fixed left-[calc(50%+22rem)] top-1/2 z-30 hidden -translate-y-1/2 xl:block 2xl:left-[calc(50%+22.5rem)]">
      <button
        type="button"
        onClick={onShow}
        className="w-40 rounded-[1.5rem] border border-stone-200/85 bg-white/78 px-4 py-3 text-left shadow-[0_22px_50px_-40px_rgba(28,25,23,0.48)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white dark:border-slate-800/90 dark:bg-slate-950/76 dark:shadow-[0_24px_55px_-36px_rgba(2,6,23,0.95)] dark:hover:bg-slate-950"
      >
        <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500 dark:text-slate-500">
          目录
        </span>
        <span className="mt-2 block text-sm font-medium leading-6 text-stone-900 dark:text-slate-100">
          {currentHeading?.numberedTitle ?? '显示章节导航'}
        </span>
      </button>
    </div>
  );
}

function extractTextContent(value: React.ReactNode): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(extractTextContent).join('');
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(value)) {
    return extractTextContent(value.props.children);
  }

  return '';
}

export function ArticleContent({ content, toc, tocDepth }: ArticleContentProps) {
  // 解析内容，提取标题并生成编号
  const { numberedContent, headings } = useMemo(() => {
    const lines = content.split('\n');
    let h2Count = 0;
    let currentRootId = '';
    const h3Counters: { [key: number]: number } = {}; // h2编号 -> h3计数
    const h4Counters: { [key: string]: number } = {}; // h2.h3编号 -> h4计数
    const h5Counters: { [key: string]: number } = {}; // h2.h3.h4编号 -> h5计数
    const h6Counters: { [key: string]: number } = {}; // h2.h3.h4.h5编号 -> h6计数
    const headings: HeadingItem[] = [];

    const newLines = lines.map((line) => {
      const h2Match = line.match(/^##\s+(.*)/);
      const h3Match = line.match(/^###\s+(.*)/);
      const h4Match = line.match(/^####\s+(.*)/);
      const h5Match = line.match(/^#####\s+(.*)/);
      const h6Match = line.match(/^######\s+(.*)/);

      if (h2Match) {
        h2Count++;
        h3Counters[h2Count] = 0;
        const numberedTitle = `${h2Count}. ${h2Match[1]}`;
        const id = getHeadingId(numberedTitle);
        currentRootId = id;
        headings.push({
          id,
          level: 2,
          numberedTitle,
          rootId: id,
        });
        return `## ${numberedTitle}`;
      }

      if (h3Match) {
        h3Counters[h2Count]++;
        const h3Num = h3Counters[h2Count];
        h4Counters[`${h2Count}.${h3Num}`] = 0;
        const numberedTitle = `${h2Count}.${h3Num} ${h3Match[1]}`;
        const id = getHeadingId(numberedTitle);
        headings.push({
          id,
          level: 3,
          numberedTitle,
          rootId: currentRootId || id,
        });
        return `### ${numberedTitle}`;
      }

      if (h4Match) {
        const h3Num = h3Counters[h2Count];
        h4Counters[`${h2Count}.${h3Num}`]++;
        const h4Num = h4Counters[`${h2Count}.${h3Num}`];
        h5Counters[`${h2Count}.${h3Num}.${h4Num}`] = 0;
        const numberedTitle = `${h2Count}.${h3Num}.${h4Num} ${h4Match[1]}`;
        const id = getHeadingId(numberedTitle);
        headings.push({
          id,
          level: 4,
          numberedTitle,
          rootId: currentRootId || id,
        });
        return `#### ${numberedTitle}`;
      }

      if (h5Match) {
        const h3Num = h3Counters[h2Count];
        const h4Num = h4Counters[`${h2Count}.${h3Num}`];
        h5Counters[`${h2Count}.${h3Num}.${h4Num}`]++;
        const h5Num = h5Counters[`${h2Count}.${h3Num}.${h4Num}`];
        h6Counters[`${h2Count}.${h3Num}.${h4Num}.${h5Num}`] = 0;
        const numberedTitle = `${h2Count}.${h3Num}.${h4Num}.${h5Num} ${h5Match[1]}`;
        const id = getHeadingId(numberedTitle);
        headings.push({
          id,
          level: 5,
          numberedTitle,
          rootId: currentRootId || id,
        });
        return `##### ${numberedTitle}`;
      }

      if (h6Match) {
        const h3Num = h3Counters[h2Count];
        const h4Num = h4Counters[`${h2Count}.${h3Num}`];
        const h5Num = h5Counters[`${h2Count}.${h3Num}.${h4Num}`];
        h6Counters[`${h2Count}.${h3Num}.${h4Num}.${h5Num}`]++;
        const h6Num = h6Counters[`${h2Count}.${h3Num}.${h4Num}.${h5Num}`];
        const numberedTitle = `${h2Count}.${h3Num}.${h4Num}.${h5Num}.${h6Num} ${h6Match[1]}`;
        const id = getHeadingId(numberedTitle);
        headings.push({
          id,
          level: 6,
          numberedTitle,
          rootId: currentRootId || id,
        });
        return `###### ${numberedTitle}`;
      }

      return line;
    });

    return {
      numberedContent: newLines.join('\n'),
      headings,
    };
  }, [content]);

  const effectiveTocDepth = normalizeTocDepth(tocDepth);
  const tocHeadings = headings.filter((heading) => heading.level <= effectiveTocDepth);
  const tocGroups = useMemo(() => buildTocGroups(tocHeadings), [tocHeadings]);
  const shouldShowToc = toc ?? tocHeadings.length >= 4;
  const activeHeadingId = useActiveHeading(tocHeadings);
  const activeHeading = tocHeadings.find((heading) => heading.id === activeHeadingId) ?? tocHeadings[0];
  const expandedRootId = activeHeading?.rootId ?? tocGroups[0]?.heading.id;
  const [isTocHidden, setIsTocHidden] = useState(false);

  useEffect(() => {
    setIsTocHidden(false);
  }, [content, toc, tocDepth]);

  const renderHeading = (Tag: 'h2' | 'h3' | 'h4' | 'h5' | 'h6', level: number) => {
    return ({ children, node, ...props }: any) => {
      const headingText = extractTextContent(children);
      const id = getHeadingId(headingText);
      const headingClassName = getArticleHeadingClasses(level);
      const mergedClassName = [props.className, headingClassName].filter(Boolean).join(' ');

      return (
        <Tag {...props} id={id} className={mergedClassName}>
          <a href={`#${id}`} className="no-underline transition-colors hover:opacity-90">
            {children}
          </a>
        </Tag>
      );
    };
  };
  const contentMarkup = (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHighlight]}
        components={{
          h1: ({ children }) => null,
          h2: renderHeading('h2', 2),
          h3: renderHeading('h3', 3),
          h4: renderHeading('h4', 4),
          h5: renderHeading('h5', 5),
          h6: renderHeading('h6', 6),
          pre: ({ children }: any) => {
            const child = React.Children.toArray(children)[0];

            if (!React.isValidElement<{ className?: string; children?: React.ReactNode }>(child)) {
              return <pre>{children}</pre>;
            }

            const className = child.props.className ?? '';
            const codeChildren = child.props.children;
            const rawCode = extractTextContent(codeChildren).replace(/\n$/, '');
            const isMermaid = className.includes('language-mermaid') || className.includes('mermaid');

            if (isMermaid) {
              return <MermaidDiagram chart={rawCode} />;
            }

            return (
              <CodeBlock className={className} code={rawCode}>
                {codeChildren}
              </CodeBlock>
            );
          },
          code: ({ node, className, children, ...props }: any) => (
            <code className={className} {...props}>
              {children}
            </code>
          ),
          img: ({ node, src, alt, width }: any) => (
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

  if (!shouldShowToc || tocHeadings.length === 0) {
    return <div className="max-w-3xl">{contentMarkup}</div>;
  }

  return (
    <>
      <div className="max-w-3xl">
        {isTocHidden ? (
          <div className="not-prose mb-6 xl:hidden">
            <button
              type="button"
              onClick={() => setIsTocHidden(false)}
              className="inline-flex items-center rounded-full border border-stone-200/85 bg-white/80 px-4 py-2 text-sm font-medium text-stone-700 shadow-[0_18px_35px_-30px_rgba(28,25,23,0.36)] backdrop-blur-sm transition-colors hover:bg-white dark:border-slate-700/90 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              显示目录
            </button>
          </div>
        ) : (
          <MobileTableOfContents
            groups={tocGroups}
            activeId={activeHeadingId}
            expandedRootId={expandedRootId}
            currentHeading={activeHeading}
            isHidden={isTocHidden}
            onToggleHidden={() => setIsTocHidden(true)}
          />
        )}
        {contentMarkup}
      </div>
      {isTocHidden ? (
        <DesktopTableOfContentsTrigger
          currentHeading={activeHeading}
          onShow={() => setIsTocHidden(false)}
        />
      ) : (
        <DesktopTableOfContents
          groups={tocGroups}
          activeId={activeHeadingId}
          expandedRootId={expandedRootId}
          currentHeading={activeHeading}
          onToggleHidden={() => setIsTocHidden(true)}
        />
      )}
    </>
  );
}
