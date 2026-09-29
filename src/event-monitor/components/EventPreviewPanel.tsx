import { useNavigate } from 'react-router-dom';
import type { SimulatedCycloneData } from '../mockCycloneData';

interface EventPreviewPanelProps {
  data: SimulatedCycloneData;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventPreviewPanel({ data, isOpen, onClose }: EventPreviewPanelProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="absolute right-4 top-4 bottom-4 w-[360px] bg-[#1e1b4b]/95 backdrop-blur-md border border-[#312e81] rounded-2xl shadow-2xl z-30 p-5 flex flex-col justify-between text-white font-mono transition-all duration-300">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between pb-3 border-b border-[#312e81]">
          <div>
            <span className="text-[10px] font-[700] text-[#fef08a] tracking-[0.05em] uppercase block">
              EVENT PREVIEW • {data.statusLabel}
            </span>
            <h3 className="text-[17px] font-[800] text-white tracking-tight mt-0.5">
              {data.name}
            </h3>
            <div className="text-[11px] font-[500] text-[#a5b4fc]">
              Bay of Bengal Sector ({data.latitude}°N, {data.longitude}°E)
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#312e81]/60 hover:bg-[#312e81] text-[#a5b4fc] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          <div className="bg-[#0f172a]/80 p-3 rounded-xl border border-[#312e81]">
            <div className="text-[10px] font-[700] text-[#94a3b8] tracking-[0.04em] uppercase">Severity</div>
            <div className="text-[15px] font-[800] text-[#f87171] mt-0.5">{data.severity}</div>
          </div>

          <div className="bg-[#0f172a]/80 p-3 rounded-xl border border-[#312e81]">
            <div className="text-[10px] font-[700] text-[#94a3b8] tracking-[0.04em] uppercase">Confidence</div>
            <div className="text-[15px] font-[800] text-[#34d399] mt-0.5">
              {(data.confidence * 100).toFixed(0)}%
            </div>
          </div>

          <div className="bg-[#0f172a]/80 p-3 rounded-xl border border-[#312e81]">
            <div className="text-[10px] font-[700] text-[#94a3b8] tracking-[0.04em] uppercase">Detected</div>
            <div className="text-[13px] font-[700] text-[#e0e7ff] mt-0.5">{data.detectedDay}</div>
          </div>

          <div className="bg-[#0f172a]/80 p-3 rounded-xl border border-[#312e81]">
            <div className="text-[10px] font-[700] text-[#94a3b8] tracking-[0.04em] uppercase">Movement</div>
            <div className="text-[13px] font-[700] text-[#38bdf8] mt-0.5">{data.movement}</div>
          </div>
        </div>

        {/* Event Evolution Timeline */}
        <div className="bg-[#0f172a]/80 p-3.5 rounded-xl border border-[#312e81] space-y-2">
          <div className="text-[10px] font-[700] text-[#a5b4fc] tracking-[0.04em] uppercase flex items-center justify-between">
            <span>EVENT EVOLUTION</span>
            <span className="material-symbols-outlined text-[14px]">timeline</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            {data.track.map((step, idx) => (
              <div key={step.timestamp} className="flex items-center gap-1.5">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      step.timestamp === 'NOW' ? 'bg-[#f87171] ring-2 ring-red-400' : 'bg-[#4f46e5]'
                    }`}
                  />
                  <span className="text-[9px] font-[700] text-[#cbd5e1] mt-1">{step.label}</span>
                </div>
                {idx < data.track.length - 1 && (
                  <span className="text-[10px] text-[#64748b] font-bold pb-3">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t border-[#312e81]">
        <button
          type="button"
          onClick={() => navigate(`/event-details/${data.id}`)}
          className="w-full py-2.5 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-mono text-[13px] font-[700] shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>View Satellite Evolution</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/event-details')}
          className="w-full py-2 px-4 rounded-xl bg-[#1e293b] hover:bg-[#334155] border border-[#312e81] text-[#e0e7ff] font-mono text-[12px] font-[700] flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>View Event Details</span>
          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
        </button>
      </div>
    </div>
  );
}
