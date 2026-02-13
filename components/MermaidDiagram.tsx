'use client';

import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

// Initialize mermaid once
if (typeof window !== 'undefined' && !mermaid.getInitialized()) {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  });
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [id] = React.useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (ref.current && typeof window !== 'undefined') {
      mermaid.render(id, chart).then((result) => {
        if (ref.current) {
          ref.current.innerHTML = result.svg;
        }
      }).catch((error) => {
        if (ref.current) {
          ref.current.innerHTML = `<p class="text-red-500">Mermaid diagram error: ${error.message}</p>`;
        }
      });
    }
  }, [chart, id]);

  return <div ref={ref} className="mermaid flex justify-center my-4" />;
}
