'use client';

import { useState, useRef } from 'react';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  node?: any;
}

export function CodeBlock({ children, className = '', ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const copyToClipboard = async () => {
    if (preRef.current) {
      const code = preRef.current.textContent || '';
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="group relative">
      <button
        onClick={copyToClipboard}
        className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs bg-gray-100/90 dark:bg-gray-800/90 hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 backdrop-blur-sm"
        aria-label="Copy code"
      >
        {copied ? '已复制' : '复制'}
      </button>
      <pre ref={preRef} className={`${className} rounded-lg`} {...props}>
        {children}
      </pre>
    </div>
  );
}
