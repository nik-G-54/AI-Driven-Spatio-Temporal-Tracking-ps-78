import type { MapBounds, NwpFieldData } from '../event-details.api';
import { projectCoordinateToMap } from '../event-details.utils';

interface NwpFieldProps {
  field: NwpFieldData;
  bounds: MapBounds;
}

const SVG_WIDTH = 540;
const SVG_HEIGHT = 410;

export default function NwpField({ field, bounds }: NwpFieldProps) {
  const peak = projectCoordinateToMap(field.centroid.latitude, field.centroid.longitude, bounds, SVG_WIDTH, SVG_HEIGHT);

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 bg-[#EFF4FF] flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-headline-sm text-[#0F172A]">ORIGINAL NWP INPUT FIELD</span>
            <span className="inline-flex items-center font-mono text-[10px] px-2 py-0.5 rounded bg-[#E5EEFF] text-[#475569] font-semibold">
              {field.resolutionKm} KM RESOLUTION
            </span>
          </div>
          <p className="text-body-sm text-[#475569]">Global Ensemble Forecast (NEPS-G) • Coarse spatial field</p>
        </div>
        <span className="material-symbols-outlined text-[#475569] text-[20px]">blur_on</span>
      </div>

      <div className="relative w-full h-[410px] bg-[#0c1829] overflow-hidden select-none">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
          <defs>
            <pattern id="coarse12kmGrid" width="45" height="45" patternUnits="userSpaceOnUse">
              <rect width="45" height="45" fill="none" stroke="#334155" strokeOpacity="0.45" strokeWidth="0.75" />
            </pattern>
            <radialGradient id="nwpDiffuseField" cx="48%" cy="52%" r="42%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.75" />
              <stop offset="35%" stopColor="#ea580c" stopOpacity="0.65" />
              <stop offset="65%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="85%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>
            <filter id="coarseSmooth">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>

          <path d="M 0,220 Q 140,240 240,210 T 420,130 T 540,90 L 540,410 L 0,410 Z" fill="#091320" />
          <path d="M 0,0 L 540,0 L 540,90 Q 420,130 240,210 T 0,220 Z" fill="#0f2238" />
          <path
            d="M 0,220 Q 140,240 240,210 T 420,130 T 540,90"
            fill="none"
            stroke="#475569"
            strokeDasharray="2 2"
            strokeWidth="1.75"
          />

          <ellipse cx={peak.x} cy={peak.y + 5} fill="url(#nwpDiffuseField)" filter="url(#coarseSmooth)" rx="145" ry="115" />
          <circle cx={peak.x} cy={peak.y} fill="#dc2626" fillOpacity="0.6" filter="url(#coarseSmooth)" r="50" />

          <rect width="100%" height="100%" fill="url(#coarse12kmGrid)" />

          <g fill="#94a3b8" fontFamily="Inter" fontSize="10" letterSpacing="1">
            <text x="30" y="50">ODISHA INTERIOR</text>
            <text x="210" y="270">CHILIKA</text>
            <text x="310" y="160">PURI SECTOR</text>
            <text fill="#38bdf8" x="390" y="360">BAY OF BENGAL</text>
          </g>

          <circle cx={peak.x} cy={peak.y} fill="none" r="18" stroke="#f8fafc" strokeDasharray="3 3" strokeWidth="1.2" />
          <circle cx={peak.x} cy={peak.y} fill="#f8fafc" r="2.5" />
          <text fill="#f8fafc" fontFamily="JetBrains Mono" fontSize="11" fontWeight="600" x={peak.x + 12} y={peak.y - 5}>
            Smoothed Peak ~{field.fieldPeak.value} mm/d
          </text>
          <text fill="#cbd5e1" fontFamily="JetBrains Mono" fontSize="9" x={peak.x + 12} y={peak.y + 9}>
            ({field.blurAreaKm}×{field.blurAreaKm} km blur area)
          </text>
        </svg>

        <div className="absolute top-3 left-3 px-2 py-1 bg-[#0f172a]/90 backdrop-blur rounded font-mono text-[10px] text-[#dce9ff]">
          NWP GRID MESH: {field.gridMeshLabel}
        </div>
      </div>

      <div className="p-3 bg-[#EFF4FF] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#45464D]">
        <span>
          Field Peak: <strong className="text-[#0F172A]">{field.fieldPeak.value} {field.fieldPeak.unit}</strong> (Smoothed)
        </span>
        <span>•</span>
        <span>
          Grid Size: <strong className="text-[#0F172A]">{field.resolutionKm} km × {field.resolutionKm} km</strong>
        </span>
        <span>•</span>
        <span>
          Resolution: <span className="text-[#475569] font-medium">{field.resolutionLabel}</span>
        </span>
      </div>
    </div>
  );
}
