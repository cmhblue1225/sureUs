"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
  className?: string;
}

// 다크 모드 감지 (CSS 미디어 쿼리 기반)
function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 초기 다크 모드 상태 확인
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    // 다크 모드 변경 감지
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isDark;
}

export function MermaidDiagram({ chart, title, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const isDarkMode = useDarkMode();

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Mermaid 초기화 (테마 적용)
        mermaid.initialize({
          startOnLoad: false,
          theme: isDarkMode ? "dark" : "default",
          securityLevel: "loose",
          fontFamily: "inherit",
          flowchart: {
            htmlLabels: true,
            curve: "basis",
          },
          sequence: {
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 50,
            width: 150,
            height: 65,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
          },
          pie: {
            textPosition: 0.75,
          },
        });

        // 고유 ID 생성
        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;

        // 다이어그램 렌더링
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError("다이어그램 렌더링 중 오류가 발생했습니다.");
      }
    };

    renderDiagram();
  }, [chart, isDarkMode]);

  if (error) {
    return (
      <div className={`p-4 border border-destructive/50 bg-destructive/10 rounded-lg ${className}`}>
        <p className="text-destructive text-sm">{error}</p>
        <pre className="mt-2 text-xs text-muted-foreground overflow-x-auto">{chart}</pre>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      )}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto bg-card border border-border rounded-lg p-4"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
