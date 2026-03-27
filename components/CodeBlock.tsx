'use client';

import { useEffect, useState } from 'react';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  code: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  sh: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  py: 'Python',
  rb: 'Ruby',
  rs: 'Rust',
  yml: 'YAML',
  yaml: 'YAML',
  md: 'Markdown',
  plaintext: 'Text',
  text: 'Text',
};

function getLanguageLabel(className: string) {
  const match = className.match(/language-([\w-]+)/i);
  if (!match) {
    return 'Text';
  }

  const language = match[1].toLowerCase();
  return LANGUAGE_LABELS[language] ?? language.toUpperCase();
}

export function CodeBlock({ children, className = '', code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const languageLabel = getLanguageLabel(className);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <figure className="code-block not-prose my-6 overflow-hidden rounded-2xl border border-[var(--code-border)] bg-[var(--code-shell-bg)] shadow-[var(--code-shadow)]">
      <div className="code-block-header flex items-center justify-between gap-3 border-b border-[var(--code-border)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80 dark:bg-rose-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 dark:bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 dark:bg-emerald-500/70" />
          </div>
          <span className="truncate rounded-full border border-black/5 bg-black/[0.035] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--code-muted)] dark:border-white/10 dark:bg-white/[0.045]">
            {languageLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={copyToClipboard}
          className="code-copy-button inline-flex shrink-0 items-center rounded-full border border-[var(--code-border)] px-3 py-1.5 text-[11px] font-medium text-[var(--code-fg)] transition-all duration-200"
          aria-label="Copy code"
        >
          {copied ? '已复制' : '复制代码'}
        </button>
      </div>

      <pre className="m-0 overflow-x-auto bg-transparent p-0">
        <code className={className}>
          {children}
        </code>
      </pre>
    </figure>
  );
}
