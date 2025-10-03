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

  const leftPercentRef = useRef(25);
  const middlePercentRef = useRef(65);
  const rightPercentRef = useRef(10);

  const [isLg, setIsLg] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [whichHandle, setWhichHandle] = useState(0);
  const [startRelativeX, setStartRelativeX] = useState(0);
  const [startLeftPercent, setStartLeftPercent] = useState(0);
  const [startMiddlePercent, setStartMiddlePercent] = useState(0);
  const [startRightPercent, setStartRightPercent] = useState(0);

  const [leftPercent, setLeftPercent] = useState(25);
  const [middlePercent, setMiddlePercent] = useState(65);
  const [rightPercent, setRightPercent] = useState(10);

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
          l >= 20 && m >= 50 && r >= 10 &&
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
      newLeft = Math.max(20, Math.min(35, newLeft));
      const oldSumLM = startLeftPercent + startMiddlePercent;
      let newMiddle = oldSumLM - newLeft;
      if (newMiddle < 50) {
        newLeft = oldSumLM - 50;
        newMiddle = 50;
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
      newMiddle = Math.max(50, Math.min(70, newMiddle));
      newRight = Math.max(10, Math.min(25, newRight));
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

  if (isLg) {
    return (
      <div className="bg-background flex-1">
        <div className="w-full px-4 flex flex-col lg:flex-row h-full">
          <div ref={containerRef} className="flex flex-col lg:flex-row gap-1 flex-1 h-full">
            <div 
              ref={leftRef} 
              className="h-full w-full lg:flex-none overflow-y-auto border border-[#D4AF37] rounded-lg" 
              style={{ flexBasis: `${leftPercent}%` }}
            >
              {newsSidebar}
            </div>
            <div 
              className="hidden lg:block lg:flex-none w-[0.1875px] h-full bg-blue-50 cursor-col-resize flex items-center justify-center relative group hover:bg-blue-100 transition-colors duration-150 z-10"
              title="Drag to resize left and center panels"
              onMouseDown={(e) => startDrag(1, e)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <GripVertical className="h-[0.375px] w-[0.0625px] text-blue-400 group-hover:text-blue-600 transition-colors duration-150" />
            </div>
            <div 
              ref={middleRef} 
              className="h-full w-full lg:flex-none overflow-y-auto border border-[#D4AF37] rounded-lg" 
              style={{ flexBasis: `${middlePercent}%` }}
            >
              {aiSearch}
            </div>
            <div 
              className="hidden lg:block lg:flex-none w-[0.1875px] h-full bg-blue-50 cursor-col-resize flex items-center justify-center relative group hover:bg-blue-100 transition-colors duration-150 z-10"
              title="Drag to resize center and right panels"
              onMouseDown={(e) => startDrag(2, e)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <GripVertical className="h-[0.375px] w-[0.0625px] text-blue-400 group-hover:text-blue-600 transition-colors duration-150" />
            </div>
            <div 
              ref={rightRef} 
              className="h-full w-full lg:flex-none overflow-y-auto border border-[#D4AF37] rounded-lg" 
              style={{ flexBasis: `${rightPercent}%` }}
            >
              {additionalServices}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="bg-background flex-1">
        <div className="w-full max-w-[1200px] mx-auto px-1 sm:px-2 lg:px-3 flex flex-col h-full">
          <div className="w-full flex-none overflow-y-auto mb-4 border border-[#D4AF37] rounded-lg">
            {aiSearch}
          </div>
          <div className="w-full flex-none overflow-y-auto mb-4 border border-[#D4AF37] rounded-lg">
            {newsSidebar}
          </div>
          <div className="w-full flex-none overflow-y-auto border border-[#D4AF37] rounded-lg">
            {additionalServices}
          </div>
        </div>
      </div>
    );
  }
}