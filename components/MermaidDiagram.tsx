'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

let mermaidInitialized = false;

const initializeMermaid = () => {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });
    mermaidInitialized = true;
  }
};

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [id] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeMermaid();

      const renderDiagram = async () => {
        try {
          // In mermaid v11+, render returns { svg } object
          const { svg } = await mermaid.render(id, chart);
          setSvg(svg);
          setError('');
        } catch (err) {
          console.error('Mermaid rendering error:', err);
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
        }
      };

      renderDiagram();
    }
  }, [chart, id]);

  if (error) {
    return (
      <div className="mermaid flex justify-center my-4">
        <p className="text-red-500">Mermaid diagram error: {error}</p>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="mermaid flex justify-center my-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
