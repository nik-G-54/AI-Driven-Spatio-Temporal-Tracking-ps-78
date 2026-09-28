import { useEffect, useRef, useState } from 'react';
import type { AiFieldData, MapBounds, NwpFieldData } from '../event-details.api';
import type { ViewMode } from './EventDetailsHeader';
import NwpField from './NwpField';
import DownscaledField from './DownscaledField';

interface ComparisonViewProps {
  viewMode: ViewMode;
  showGrid: boolean;
  nwpField: NwpFieldData;
  aiField: AiFieldData;
  bounds: MapBounds;
}

export default function ComparisonView({ viewMode, showGrid, nwpField, aiField, bounds }: ComparisonViewProps) {
  const [swipePercent, setSwipePercent] = useState(50);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      setSwipePercent((offsetX / rect.width) * 100);
    };
    const handleUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  if (viewMode === 'side-by-side') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NwpField field={nwpField} bounds={bounds} />
        <DownscaledField field={aiField} showGrid={showGrid} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[460px] bg-[#0c1829] rounded-xl shadow-sm overflow-hidden select-none"
    >
      <div className="absolute inset-0 w-full h-full">
        <DownscaledField field={aiField} showGrid={showGrid} />
      </div>

      <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${swipePercent}%` }}>
        <div className="w-[1080px] lg:w-[200%] h-full">
          <NwpField field={nwpField} bounds={bounds} />
        </div>
      </div>

      <div
        className="absolute top-0 bottom-0 -ml-3.5 w-7 flex items-center justify-center cursor-ew-resize z-20"
        style={{ left: `${swipePercent}%` }}
        onMouseDown={() => {
          isDraggingRef.current = true;
        }}
      >
        <div className="w-1 h-full bg-white shadow-xl" />
        <div className="absolute w-8 h-8 rounded-full bg-white text-[#0F172A] shadow-md flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
        </div>
      </div>
    </div>
  );
}
