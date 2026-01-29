'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import { siteConfig } from '@/config/site';

export function Giscus() {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!ref.current || ref.current.hasChildNodes()) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', siteConfig.giscus.repo);
    script.setAttribute('data-repo-id', siteConfig.giscus.repoId);
    script.setAttribute('data-category', siteConfig.giscus.category);
    script.setAttribute('data-category-id', siteConfig.giscus.categoryId);
    script.setAttribute('data-mapping', siteConfig.giscus.mapping);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', siteConfig.giscus.reactionsEnabled ? '1' : '0');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', siteConfig.giscus.inputPosition);
    script.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    script.setAttribute('data-lang', siteConfig.giscus.lang);
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    ref.current.appendChild(script);
  }, []);

  useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[src*="giscus"]');
    iframe?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: theme === 'dark' ? 'dark' : 'light' } } },
      'https://giscus.app'
    );
  }, [theme]);

  return (
    <div className="mt-12">
      <div ref={ref} />
    </div>
  );
}
