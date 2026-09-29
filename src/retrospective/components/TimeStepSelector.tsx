import { classNames, formatLead } from '../retrospective.utils';
import { CAP, PANEL } from './ui';

interface TimeStepSelectorProps {
  // Anything with a lead time (analysis steps or dataset frames).
  frames: Array<{ leadTimeHours: number }>;
  // Valid time of the selected step, shown next to the buttons.
  validTime?: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
  // Optional auto-advance; manual selection always works and pauses playback.
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

// Shared time control: drives every map, chart and context layer on the page.
// Drawn as a timeline scrubber: past steps filled, the selected step highlighted.
export default function TimeStepSelector({ frames, selectedIndex, onSelect, isPlaying = false, onTogglePlay, validTime }: TimeStepSelectorProps) {
  if (frames.length <= 1) return null;
  const pct = (i: number) => (frames.length > 1 ? (i / (frames.length - 1)) * 100 : 0);
  return (
    <section className={`${PANEL} flex items-center gap-5 px-4 h-[58px]`} aria-label="Time step">
      <span className={CAP}>Time</span>
      {onTogglePlay && (
        <button
          type="button"
          onClick={onTogglePlay}
          aria-pressed={isPlaying}
          className={classNames(
            'h-8 px-3 flex items-center gap-1.5 border text-[12px] font-medium',
            isPlaying ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-[#EAF7FE]' : 'border-[#2B3846] bg-[#0F151C] text-[#D9E1EA] hover:bg-[#15202B]',
          )}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d={isPlaying ? 'M1.5 1H4V9H1.5ZM6 1H8.5V9H6Z' : 'M2 1L9 5L2 9Z'} fill="currentColor" />
          </svg>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      )}
      <div className="relative flex-1 min-w-[320px] h-full" role="group" aria-label="Forecast lead">
        <div className="absolute left-3 right-3 top-[19px] h-[2px] bg-[#243140]" />
        <div className="absolute left-3 top-[19px] h-[2px] bg-[#38BDF8] transition-all" style={{ width: `calc((100% - 24px) * ${pct(selectedIndex) / 100})` }} />
        {frames.map((frame, index) => {
          const active = index === selectedIndex;
          const past = index < selectedIndex;
          return (
            <button
              key={frame.leadTimeHours}
              type="button"
              onClick={() => onSelect(index)}
              aria-pressed={active}
              aria-label={`Lead ${formatLead(frame.leadTimeHours)}`}
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center gap-1.5 pt-[13px] px-1 group"
              style={{ left: `calc(12px + (100% - 24px) * ${pct(index) / 100})` }}
            >
              <span
                className={classNames(
                  'block rounded-full border-2 transition-all',
                  active ? 'w-[14px] h-[14px] -mt-[1px] border-[#38BDF8] bg-[#38BDF8] shadow-[0_0_0_4px_rgba(56,189,248,0.18)]' : past ? 'w-3 h-3 border-[#38BDF8] bg-[#0B1117]' : 'w-3 h-3 border-[#3A4756] bg-[#0B1117] group-hover:border-[#8794A4]',
                )}
              />
              <span className={classNames('font-mono text-[10.5px]', active ? 'text-[#EAF7FE] font-semibold' : 'text-[#8794A4] group-hover:text-[#D9E1EA]')}>{formatLead(frame.leadTimeHours)}</span>
            </button>
          );
        })}
      </div>
      {validTime && (
        <div className="flex flex-col items-end shrink-0">
          <span className={CAP}>Valid time</span>
          <span className="font-mono text-[12px] text-[#E6EDF4]">{validTime}</span>
        </div>
      )}
    </section>
  );
}
