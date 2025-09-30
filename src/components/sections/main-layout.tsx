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

  const leftPercentRef = useRef(33.33);
  const middlePercentRef = useRef(50);
  const rightPercentRef = useRef(16.67);

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

  // Load from localStorage on mount with validation
  useEffect(() => {
    const saved = localStorage.getItem('layoutWidths');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const { leftPercent: l, middlePercent: m, rightPercent: r } = parsed;
        const sum = l + m + r;
        if (
          typeof l === 'number' && typeof m === 'number' && typeof r === 'number' &&
          l >= 15 && m >= 30 && r >= 10 &&
          Math.abs(sum - 100) < 0.5
        ) {
          setLeftPercent(l);
          setMiddlePercent(m);
          setRightPercent(r);
          leftPercentRef.current = l;
          middlePercentRef.current = m;
          rightPercentRef.current = r;
          return;
        }
      } catch (e) {
        // Ignore invalid data
      }
    }
  }, []);

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
      leftPercentRef.current = newLeft;
      setMiddlePercent(newMiddle);
      middlePercentRef.current = newMiddle;
      rightPercentRef.current = rightPercent;
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
      middlePercentRef.current = newMiddle;
      setRightPercent(oldSumMR - newMiddle);
      rightPercentRef.current = oldSumMR - newMiddle;
      leftPercentRef.current = leftPercent;
    }
  }, [isDragging, whichHandle, startRelativeX, startLeftPercent, startMiddlePercent, startRightPercent, leftPercent, rightPercent]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    // Save to localStorage on drag end using refs
    localStorage.setItem('layoutWidths', JSON.stringify({ 
      leftPercent: leftPercentRef.current, 
      middlePercent: middlePercentRef.current, 
      rightPercent: rightPercentRef.current 
    }));
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
    <div className="bg-white flex-1">
      <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 flex flex-col lg:flex-row h-full">
        <div ref={containerRef} className="flex flex-col lg:flex-row gap-0 flex-1 h-full">
          <div 
            ref={leftRef} 
            className="h-full w-full lg:flex-none overflow-y-auto" 
            style={{ flexBasis: isLg ? `${leftPercent}%` : '100%' }}
          >
            {newsSidebar}
          </div>
          <div 
            className="hidden lg:block lg:flex-none w-[0.1875px] h-full bg-gray-100 cursor-col-resize flex items-center justify-center relative group hover:bg-primary/10 transition-colors duration-150 z-10"
            title="Drag to resize left and center panels"
            onMouseDown={(e) => startDrag(1, e)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <GripVertical className="h-[0.375px] w-[0.0625px] text-gray-500 group-hover:text-primary transition-colors duration-150" />
          </div>
          <div 
            ref={middleRef} 
            className="h-full w-full lg:flex-none overflow-y-auto" 
            style={{ flexBasis: isLg ? `${middlePercent}%` : '100%' }}
          >
            {aiSearch}
          </div>
          <div 
            className="hidden lg:block lg:flex-none w-[0.1875px] h-full bg-gray-100 cursor-col-resize flex items-center justify-center relative group hover:bg-primary/10 transition-colors duration-150 z-10"
            title="Drag to resize center and right panels"
            onMouseDown={(e) => startDrag(2, e)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <GripVertical className="h-[0.375px] w-[0.0625px] text-gray-500 group-hover:text-primary transition-colors duration-150" />
          </div>
          <div 
            ref={rightRef} 
            className="h-full w-full lg:flex-none overflow-y-auto" 
            style={{ flexBasis: isLg ? `${rightPercent}%` : '100%' }}
          >
            {additionalServices}
          </div>
        </div>
      </div>
    </div>
  )
}