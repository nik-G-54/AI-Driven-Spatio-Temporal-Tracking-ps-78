import { useEffect, useState } from 'react';
import type { ForecastTimeline } from '../dashboard.api';
import TimelineStep from './TimelineStep';

interface EnsembleForecastTimelineProps {
  timeline: ForecastTimeline;
}

const PLAYBACK_INTERVAL_MS = 1200;

export default function EnsembleForecastTimeline({ timeline }: EnsembleForecastTimelineProps) {
  const [selectedIndex, setSelectedIndex] = useState(timeline.selectedStepIndex);
  const [isPlaying, setIsPlaying] = useState(false);

  const lastIndex = timeline.steps.length - 1;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setSelectedIndex((prev) => (prev >= lastIndex ? 0 : prev + 1));
    }, PLAYBACK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPlaying, lastIndex]);

  const goToPrevious = () => setSelectedIndex((prev) => Math.max(0, prev - 1));
  const goToNext = () => setSelectedIndex((prev) => Math.min(lastIndex, prev + 1));

  const selectedStep = timeline.steps[selectedIndex];
  const progressPercent = (selectedIndex / lastIndex) * 100;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-headline-sm text-[#0F172A]">Ensemble Forecast Timeline</h2>
            <p className="text-body-sm text-[12px] text-[#475569] mt-0.5">
              Step through forecast leads to inspect spatio-temporal anomaly propagation
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-label-sm">
            <button
              type="button"
              onClick={goToPrevious}
              className="h-7 px-2 bg-white border border-[#CBD5E1] rounded text-[#0F172A] hover:bg-[#F1F5F9] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">fast_rewind</span>
              -12h
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              className={
                isPlaying
                  ? 'h-7 px-2.5 bg-[#DC2626] text-white rounded hover:bg-[#B91C1C] flex items-center gap-1 shadow-xs'
                  : 'h-7 px-2.5 bg-[#0F172A] text-white rounded hover:bg-[#1E293B] flex items-center gap-1 shadow-xs'
              }
            >
              <span className="material-symbols-outlined text-[15px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
              {isPlaying ? 'Pause Evolution' : 'Play Evolution'}
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="h-7 px-2 bg-white border border-[#CBD5E1] rounded text-[#0F172A] hover:bg-[#F1F5F9] flex items-center gap-1"
            >
              +12h
              <span className="material-symbols-outlined text-[15px]">fast_forward</span>
            </button>
          </div>
        </div>

        <div className="mt-6 px-3">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-[#E2E8F0] -z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#2563EB] -z-0 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
            {timeline.steps.map((step, index) => (
              <TimelineStep
                key={step.day}
                step={step}
                status={index < selectedIndex ? 'completed' : index === selectedIndex ? 'active' : 'upcoming'}
                onSelect={() => setSelectedIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span className="text-body-sm text-[12px] text-[#0F172A] font-semibold">
            Selected Window: <span className="font-mono text-[#2563EB]">{selectedStep.leadLabel}</span> (
            {selectedStep.window.description})
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-[#475569]">
          <span>
            <strong>{selectedStep.window.downscaledRiskCells}</strong> Downscaled 5km Risk Cells
          </span>
          <span className="text-[#C6C6CD]">|</span>
          <span className="text-[#047857] font-semibold">
            Ensemble Spread: {selectedStep.window.ensembleAgreement}% Agreement
          </span>
        </div>
      </div>
    </div>
  );
}
