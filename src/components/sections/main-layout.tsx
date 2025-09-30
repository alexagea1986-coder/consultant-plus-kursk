"use client"

import { ReactNode, useState, useRef, useEffect, useCallback } from "react"
import { GripVertical } from "lucide-react"

interface MainLayoutProps {
  newsSidebar: ReactNode
  aiSearch: ReactNode
  additionalServices: ReactNode
}

export default function MainLayout({ newsSidebar, aiSearch, additionalServices }: MainLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const middleRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const [isLg, setIsLg] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [whichHandle, setWhichHandle] = useState(0);
  const [startRelativeX, setStartRelativeX] = useState(0);
  const [startLeftPercent, setStartLeftPercent] = useState(0);
  const [startMiddlePercent, setStartMiddlePercent] = useState(0);
  const [startRightPercent, setStartRightPercent] = useState(0);

  const [leftPercent, setLeftPercent] = useState(33.33);
  const [middlePercent, setMiddlePercent] = useState(50);
  const [rightPercent, setRightPercent] = useState(16.67);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    setIsLg(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsLg(e.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, []);

  const startDrag = useCallback((handle: number, e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setStartRelativeX(e.clientX - rect.left);
    setStartLeftPercent(leftPercent);
    setStartMiddlePercent(middlePercent);
    setStartRightPercent(rightPercent);
    setWhichHandle(handle);
    setIsDragging(true);
    e.preventDefault();
  }, [leftPercent, middlePercent, rightPercent]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentRelativeX = e.clientX - rect.left;
    const deltaPx = currentRelativeX - startRelativeX;
    const contWidth = rect.width;
    const deltaPercent = (deltaPx / contWidth) * 100;

    if (whichHandle === 1) {
      let newLeft = startLeftPercent + deltaPercent;
      newLeft = Math.max(15, Math.min(50, newLeft));
      const oldSumLM = startLeftPercent + startMiddlePercent;
      let newMiddle = oldSumLM - newLeft;
      if (newMiddle < 30) {
        newLeft = oldSumLM - 30;
        newMiddle = 30;
      }
      setLeftPercent(newLeft);
      setMiddlePercent(newMiddle);
    } else if (whichHandle === 2) {
      let newMiddle = startMiddlePercent + deltaPercent;
      const oldSumMR = startMiddlePercent + startRightPercent;
      let newRight = oldSumMR - newMiddle;
      newMiddle = Math.max(30, Math.min(60, newMiddle));
      newRight = Math.max(10, Math.min(30, newRight));
      if (newMiddle > oldSumMR - 10) {
        newMiddle = oldSumMR - 10;
      }
      setMiddlePercent(newMiddle);
      setRightPercent(oldSumMR - newMiddle);
    }
  }, [isDragging, whichHandle, startRelativeX, startLeftPercent, startMiddlePercent, startRightPercent]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    // Save to localStorage on drag end
    localStorage.setItem('layoutWidths', JSON.stringify({ leftPercent, middlePercent, rightPercent }));
  }, [leftPercent, middlePercent, rightPercent]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('layoutWidths');
    if (saved) {
      const { leftPercent: savedLeft, middlePercent: savedMiddle, rightPercent: savedRight } = JSON.parse(saved);
      if (savedLeft && savedMiddle && savedRight && (savedLeft + savedMiddle + savedRight) === 100) {
        setLeftPercent(savedLeft);
        setMiddlePercent(savedMiddle);
        setRightPercent(savedRight);
      }
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseEnter = useCallback(() => {
    if (!isDragging) {
      document.body.style.cursor = 'col-resize';
    }
  }, [isDragging]);

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      document.body.style.cursor = 'default';
    }
  }, [isDragging]);

  return (
    <div className="bg-white min-h-screen">
      <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 py-3">
        <div ref={containerRef} className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-200px)]">
          <div 
            ref={leftRef} 
            className="h-full w-full lg:flex-none overflow-hidden" 
            style={{ flexBasis: isLg ? `${leftPercent}%` : '100%' }}
          >
            {newsSidebar}
          </div>
          <div 
            className="hidden lg:block lg:flex-none w-8 h-full bg-gray-100 cursor-col-resize flex items-center justify-center relative group hover:bg-primary/10 transition-colors duration-150 z-10"
            title="Drag to resize left and center panels"
            onMouseDown={(e) => startDrag(1, e)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <GripVertical className="h-6 w-4 text-gray-500 group-hover:text-primary transition-colors duration-150" />
          </div>
          <div 
            ref={middleRef} 
            className="h-full w-full lg:flex-none overflow-hidden" 
            style={{ flexBasis: isLg ? `${middlePercent}%` : '100%' }}
          >
            {aiSearch}
          </div>
          <div 
            className="hidden lg:block lg:flex-none w-8 h-full bg-gray-100 cursor-col-resize flex items-center justify-center relative group hover:bg-primary/10 transition-colors duration-150 z-10"
            title="Drag to resize center and right panels"
            onMouseDown={(e) => startDrag(2, e)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <GripVertical className="h-6 w-4 text-gray-500 group-hover:text-primary transition-colors duration-150" />
          </div>
          <div 
            ref={rightRef} 
            className="h-full w-full lg:flex-none overflow-hidden" 
            style={{ flexBasis: isLg ? `${rightPercent}%` : '100%' }}
          >
            {additionalServices}
          </div>
        </div>
      </div>
    </div>
  )
}