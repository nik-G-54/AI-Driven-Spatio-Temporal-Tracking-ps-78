import { DEMO_CYCLONE } from '../../event-monitor/mockCycloneData';

interface SatelliteEvolutionProps {
  eventId?: string;
}

export default function SatelliteEvolution({ eventId = 'DEMO-BOB-001' }: SatelliteEvolutionProps) {
  const data = DEMO_CYCLONE;

  return (
    <div className="bg-[#0b1220] rounded-2xl border border-[#312e81] shadow-2xl p-6 text-white font-mono space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <div className="text-[11px] font-[700] text-[#fef08a] tracking-[0.05em] uppercase">
            SATELLITE EVOLUTION ANALYSIS • INFRARED THERMAL BAND (10.8 µm)
          </div>
          <h2 className="text-xl font-[800] text-white tracking-tight mt-1">
            {data.name} — {data.locationName}
          </h2>
          <div className="text-[11px] font-[500] text-[#94a3b8] mt-0.5">
            Geostationary Satellite Ingestion • INSAT-3DR / NASA GIBS Infrared Multi-Pass
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-[700] px-3 py-1 rounded-lg bg-[#1e1b4b] border border-[#312e81] text-[#38bdf8]">
            EVENT ID: {eventId}
          </span>
          <span className="font-mono text-xs font-[700] px-3 py-1 rounded-lg bg-red-950/80 border border-red-800 text-[#f87171]">
            {data.severity}
          </span>
        </div>
      </div>

      {/* 3 Chronological Grayscale Infrared Satellite Cards */}
      <div className="space-y-3">
        <div className="text-[12px] font-[700] text-[#a5b4fc] tracking-[0.04em] uppercase flex items-center justify-between">
          <span>CHRONOLOGICAL IMAGE SEQUENCE (T-6h → T-3h → NOW)</span>
          <span className="text-[11px] font-[500] text-[#64748b]">Grayscale Infrared Thermal Convection</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {data.satelliteImages.map((img, idx) => (
            <div
              key={img.timestamp}
              className="bg-[#0f172a] rounded-xl border border-[#312e81] p-4 flex flex-col justify-between space-y-3 hover:border-[#4f46e5] transition-colors"
            >
              {/* Card Time Title */}
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                <span className="text-[12px] font-[800] text-[#f87171] uppercase tracking-wider">
                  {img.label}
                </span>
                <span className="text-[10px] text-[#94a3b8] font-[500]">{img.timeAgo}</span>
              </div>

              {/* Grayscale Meteorological Satellite Image Placeholder Container */}
              <div className="relative w-full h-56 rounded-lg bg-black border border-[#1e293b] overflow-hidden group">
                {/* Simulated Grayscale Infrared Cloud Vortex (INSAT / NASA GIBS Style) */}
                <svg className="w-full h-full object-cover" viewBox="0 0 300 300">
                  <defs>
                    <radialGradient id={`cloudGlow-${idx}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
                      <stop offset="30%" stopColor="#d1d5db" stopOpacity={0.7} />
                      <stop offset="65%" stopColor="#4b5563" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#111827" stopOpacity={0} />
                    </radialGradient>
                  </defs>

                  {/* Deep Ocean Thermal Layer (Black/Dark Gray) */}
                  <rect width="100%" height="100%" fill="#090d16" />

                  {/* Coastline Context Mesh */}
                  <path
                    d="M 0,0 L 120,0 L 140,50 L 180,90 L 220,130 L 280,180 L 300,220 Z"
                    fill="#111827"
                    stroke="#1f2937"
                    strokeWidth="1"
                  />

                  {/* Grayscale Spiral Cloud Convection */}
                  <ellipse cx="150" cy="150" rx={85 + idx * 10} ry={70 + idx * 8} fill={`url(#cloudGlow-${idx})`} />

                  {/* Spiral Arm Overlays */}
                  <g className="animate-spin" style={{ animationDuration: `${20 - idx * 3}s`, transformOrigin: '150px 150px' }}>
                    <path
                      d="M 150,150 Q 180,110 220,130 Q 240,160 210,200 Q 170,220 120,190"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth={3 + idx}
                      strokeOpacity="0.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 150,150 Q 110,180 80,150 Q 70,110 110,80 Q 150,70 190,100"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth={2 + idx}
                      strokeOpacity="0.65"
                      strokeLinecap="round"
                    />
                  </g>

                  {/* Eye Structure for NOW frame */}
                  {idx === 2 && (
                    <circle cx="150" cy="150" r="8" fill="#090d16" stroke="#ffffff" strokeWidth="1.5" />
                  )}

                  <text x="15" y="285" fill="#9ca3af" fontFamily="Geist Mono, monospace" fontSize="9">
                    INFRARED BAND 10.8µm • INSAT-3DR
                  </text>
                </svg>

                {/* Overlaid Badge */}
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur px-2 py-0.5 rounded border border-[#374151] text-[9px] font-[700] text-[#e5e7eb]">
                  VORTICITY: {img.vorticityScore}
                </div>
              </div>

              {/* Snapshot Details */}
              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="text-[#cbd5e1] font-[500] leading-snug">
                  {img.description}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#94a3b8] pt-1 border-t border-[#1e293b]">
                  <span>Density: <strong className="text-white">{img.cloudDensity}</strong></span>
                  <span>Core: <strong className="text-[#f87171]">{img.eyeStructure}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
