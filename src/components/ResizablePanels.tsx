"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface ResizablePanelsProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  defaultLeftWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export default function ResizablePanels({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 50,
  minWidth = 20,
  maxWidth = 80,
}: ResizablePanelsProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Limit the width between minWidth and maxWidth
      if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth]);

  return (
    <div ref={containerRef} className="flex h-screen">
      {/* Left Panel */}
      <div style={{ width: `${leftWidth}%` }}>{leftPanel}</div>

      {/* Draggable Divider */}
      <div
        className={`w-1 bg-slate-300 hover:bg-blue-500 cursor-col-resize transition-colors ${
          isDragging ? "bg-blue-500" : ""
        }`}
        onMouseDown={handleMouseDown}
      />

      {/* Right Panel */}
      <div style={{ width: `${100 - leftWidth}%` }}>{rightPanel}</div>
    </div>
  );
}
