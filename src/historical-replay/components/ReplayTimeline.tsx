import type { TimelineFrame } from '../historical-replay.api';
import { classNames } from '../historical-replay.utils';

interface ReplayTimelineProps {
  frames: TimelineFrame[];
  currentFrameIndex: number;
  onSelectFrame: (index: number) => void;
}

export default function ReplayTimeline({ frames, currentFrameIndex, onSelectFrame }: ReplayTimelineProps) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {frames.map((frame) => {
        const isActive = frame.index === currentFrameIndex;
        return (
          <button
            key={frame.index}
            type="button"
            onClick={() => onSelectFrame(frame.index)}
            className={classNames(
              'flex-1 min-w-[86px] flex flex-col items-center py-2 px-1 rounded transition-colors',
              isActive ? 'bg-[#EF4444] text-white font-semibold shadow-sm' : 'bg-[#EFF4FF] hover:bg-[#E5EEFF]',
            )}
          >
            <span
              className={classNames(
                'text-[10px] flex items-center gap-1',
                isActive ? 'uppercase tracking-wide' : 'text-[#475569] font-bold',
              )}
            >
              {isActive && frame.isLandfall && <span className="material-symbols-outlined text-[11px]">star</span>}
              {frame.leadLabel}
            </span>
            <span className={classNames('font-mono text-[10px]', isActive ? 'text-white/90' : 'text-[#76777D]')}>
              {frame.dateLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
