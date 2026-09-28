import { useState } from 'react';
import type { AnomalyOverview } from '../dashboard.api';
import { classNames } from '../dashboard.utils';
import AnomalyMapCanvas from './AnomalyMapCanvas';
import SelectedTargetHud from './SelectedTargetHud';
import MapLegend from './MapLegend';

interface GlobalAnomalyOverviewProps {
  data: AnomalyOverview;
}

const LAYER_GLYPH: Record<string, { node: string; activeClasses: string; inactiveClasses: string }> = {
  nwp12km: {
    node: '',
    activeClasses: 'bg-[#0F172A] text-white',
    inactiveClasses: 'bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]',
  },
  heatmap: {
    node: 'dot-red',
    activeClasses: 'bg-[#0F172A] text-white',
    inactiveClasses: 'bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]',
  },
  trajectory: {
    node: 'bar',
    activeClasses: 'bg-[#0F172A] text-white',
    inactiveClasses: 'bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]',
  },
  riskCells: {
    node: 'checker',
    activeClasses: 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] hover:bg-[#DBEAFE]',
    inactiveClasses: 'bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]',
  },
  ensembleSpread: {
    node: '',
    activeClasses: 'bg-[#0F172A] text-white',
    inactiveClasses: 'bg-[#F8FAFC] border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]',
  },
};

export default function GlobalAnomalyOverview({ data }: GlobalAnomalyOverviewProps) {
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(data.layers.map((layer) => [layer.id, layer.defaultActive])),
  );

  const toggleLayer = (id: string) => {
    setActiveLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col min-h-[580px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
            <h2 className="text-headline-sm text-[#0F172A]">Global Anomaly Overview</h2>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#E5EEFF] text-[#475569]">LIVE SYNC</span>
          </div>
          <p className="text-body-sm text-[12px] text-[#475569] mt-0.5">Domain: {data.domain.label}</p>
        </div>

        <div className="flex items-center flex-wrap gap-1.5 text-label-sm">
          {data.layers.map((layer) => {
            const glyph = LAYER_GLYPH[layer.id] ?? LAYER_GLYPH.nwp12km;
            const isActive = Boolean(activeLayers[layer.id]);
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => toggleLayer(layer.id)}
                className={classNames(
                  'px-2.5 py-1 rounded flex items-center gap-1 shadow-xs transition-colors',
                  isActive ? glyph.activeClasses : glyph.inactiveClasses,
                )}
              >
                {glyph.node === 'dot-red' && <span className="w-2 h-2 rounded-full bg-[#EF4444]" />}
                {glyph.node === 'bar' && <span className="font-bold text-[#2563EB]">━</span>}
                {glyph.node === 'checker' && <span className="text-[12px]">▒</span>}
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative w-full flex-1 min-h-[460px] mt-3 rounded-lg overflow-hidden bg-[#0A1120] border border-[#1E293B] select-none flex flex-col justify-between">
        <AnomalyMapCanvas
          domain={data.domain}
          selectedTarget={data.selectedTarget}
          secondaryAnomaly={data.secondaryAnomaly}
          trajectory={data.trajectory}
          riskCells={data.riskCells}
          activeLayers={activeLayers}
        />
        <SelectedTargetHud target={data.selectedTarget} />
        <MapLegend projection={data.legend.projection} scale={data.legend.scale} />
      </div>
    </div>
  );
}
