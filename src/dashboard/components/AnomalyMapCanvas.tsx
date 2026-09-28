import type { GeoDomain, RiskCell, SecondaryAnomaly, SelectedTarget, TrajectoryPoint } from '../dashboard.api';
import { getSeverityStyle, projectGeoPointToSvg, type SvgPoint } from '../dashboard.utils';

interface AnomalyMapCanvasProps {
  domain: GeoDomain;
  selectedTarget: SelectedTarget;
  secondaryAnomaly: SecondaryAnomaly;
  trajectory: TrajectoryPoint[];
  riskCells: RiskCell[];
  activeLayers: Record<string, boolean>;
}

function buildConePolygon(start: SvgPoint, end: SvgPoint, startSpread: number, endSpread: number): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const perpX = -dy / length;
  const perpY = dx / length;

  const a = { x: start.x + perpX * startSpread, y: start.y + perpY * startSpread };
  const b = { x: start.x - perpX * startSpread, y: start.y - perpY * startSpread };
  const c = { x: end.x - perpX * endSpread, y: end.y - perpY * endSpread };
  const d = { x: end.x + perpX * endSpread, y: end.y + perpY * endSpread };

  return [a, b, c, d].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

export default function AnomalyMapCanvas({
  domain,
  selectedTarget,
  secondaryAnomaly,
  trajectory,
  riskCells,
  activeLayers,
}: AnomalyMapCanvasProps) {
  const sortedTrajectory = [...trajectory].sort((a, b) => a.leadHour - b.leadHour);
  const projectedTrajectory = sortedTrajectory.map((point) => ({
    ...point,
    svg: projectGeoPointToSvg(point.latitude, point.longitude, domain),
  }));

  const targetPoint = projectGeoPointToSvg(
    selectedTarget.center.latitude,
    selectedTarget.center.longitude,
    domain,
  );
  const secondaryPoint = projectGeoPointToSvg(
    secondaryAnomaly.center.latitude,
    secondaryAnomaly.center.longitude,
    domain,
  );
  const secondaryRadius = secondaryAnomaly.extentDeg * 32;

  const trajectoryPath = projectedTrajectory.map((p) => `${p.svg.x},${p.svg.y}`).join(' L ');

  const conePolygon =
    projectedTrajectory.length >= 2
      ? buildConePolygon(
          projectedTrajectory[0].svg,
          projectedTrajectory[projectedTrajectory.length - 2]?.svg ?? projectedTrajectory[0].svg,
          48,
          14,
        )
      : '';

  return (
    <svg
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 1000 520"
    >
      <defs>
        <radialGradient id="cycloneHeatCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#DC2626" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#EA580C" stopOpacity="0.75" />
          <stop offset="65%" stopColor="#EAB308" stopOpacity="0.45" />
          <stop offset="85%" stopColor="#3B82F6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#1E293B" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="arabianCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EA580C" stopOpacity="0.8" />
          <stop offset="45%" stopColor="#EAB308" stopOpacity="0.4" />
          <stop offset="90%" stopColor="#0284C7" stopOpacity="0" />
        </radialGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Graticules (Lat / Lon) */}
      <g stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6">
        <line x1="120" y1="0" x2="120" y2="520" />
        <line x1="280" y1="0" x2="280" y2="520" />
        <line x1="440" y1="0" x2="440" y2="520" />
        <line x1="600" y1="0" x2="600" y2="520" />
        <line x1="760" y1="0" x2="760" y2="520" />
        <line x1="920" y1="0" x2="920" y2="520" />
        <line x1="0" y1="90" x2="1000" y2="90" />
        <line x1="0" y1="200" x2="1000" y2="200" />
        <line x1="0" y1="310" x2="1000" y2="310" />
        <line x1="0" y1="420" x2="1000" y2="420" />
      </g>

      {/* Stylized landmass geometries */}
      <g fill="#172033" stroke="#334155" strokeWidth="1.2">
        <path d="M 140,80 L 260,70 L 420,75 L 560,95 L 680,110 L 740,115 L 750,150 L 680,180 L 640,210 L 590,260 L 560,330 L 530,400 L 500,440 L 480,410 L 440,360 L 400,320 L 350,280 L 290,250 L 230,220 L 190,170 Z" />
        <path d="M 760,140 L 810,160 L 830,220 L 850,300 L 870,390 L 830,420 L 790,380 L 780,290 L 760,230 Z" />
        <path d="M 535,420 C 545,420 550,440 545,455 C 540,465 530,460 525,445 C 525,430 530,420 535,420 Z" />
      </g>

      {activeLayers.nwp12km && (
        <g fill="none" stroke="#38BDF8" strokeOpacity="0.35" strokeWidth="1">
          <path d="M 300,460 Q 420,440 550,380 T 700,280" />
          <path d="M 320,490 Q 460,460 600,400 T 780,310" />
          <path d="M 280,400 Q 380,380 470,310 T 560,190" />
          <path d="M 680,480 Q 640,420 620,340 T 570,240" />
          <path d="M 780,440 Q 720,380 670,310 T 590,220" />
          <path d="M 120,440 Q 200,360 250,290 T 320,200" stroke="#60A5FA" strokeOpacity="0.25" />
          <path d="M 150,510 Q 240,430 280,330 T 330,220" stroke="#60A5FA" strokeOpacity="0.25" />
        </g>
      )}

      {activeLayers.heatmap && (
        <>
          <circle cx={secondaryPoint.x} cy={secondaryPoint.y} r={secondaryRadius} fill="url(#arabianCore)" />
          <circle cx={targetPoint.x} cy={targetPoint.y} r="145" fill="url(#cycloneHeatCore)" />
        </>
      )}

      {activeLayers.riskCells &&
        riskCells.map((cell, index) => {
          const point = projectGeoPointToSvg(cell.latitude, cell.longitude, domain);
          const style = getSeverityStyle(cell.severity);
          return (
            <rect
              key={index}
              x={point.x - 6}
              y={point.y - 6}
              width="12"
              height="12"
              fill={style.accent}
              fillOpacity="0.7"
              stroke="#991B1B"
              strokeWidth="0.5"
            />
          );
        })}

      {activeLayers.ensembleSpread && conePolygon && (
        <polygon points={conePolygon} fill="#2563EB" fillOpacity="0.12" stroke="#60A5FA" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {activeLayers.trajectory && trajectoryPath && (
        <>
          <path d={`M ${trajectoryPath}`} fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M ${trajectoryPath}`} fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {projectedTrajectory.map((point) => {
            const isPeak =
              Math.abs(point.latitude - selectedTarget.center.latitude) < 0.001 &&
              Math.abs(point.longitude - selectedTarget.center.longitude) < 0.001;
            if (isPeak) {
              return (
                <g key={point.leadHour}>
                  <circle cx={point.svg.x} cy={point.svg.y} r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" filter="url(#glow)" />
                  <circle cx={point.svg.x} cy={point.svg.y} r="11" fill="none" stroke="#EF4444" strokeOpacity="0.7" strokeWidth="1.5">
                    <animate attributeName="r" values="7;15;7" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <text x={point.svg.x + 14} y={point.svg.y + 4} fill="#F87171" fontFamily="JetBrains Mono" fontSize="11" fontWeight="700">
                    {`T+${point.leadHour}h (PEAK)`}
                  </text>
                </g>
              );
            }
            return (
              <g key={point.leadHour}>
                <circle cx={point.svg.x} cy={point.svg.y} r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x={point.svg.x + 12} y={point.svg.y + 4} fill="#94A3B8" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600">
                  {`T+${point.leadHour}h`}
                </text>
              </g>
            );
          })}
        </>
      )}

      {/* Geographic reference coordinate labels */}
      <text x="125" y="25" fill="#64748B" fontFamily="JetBrains Mono" fontSize="9">75°E</text>
      <text x="285" y="25" fill="#64748B" fontFamily="JetBrains Mono" fontSize="9">80°E</text>
      <text x="445" y="25" fill="#64748B" fontFamily="JetBrains Mono" fontSize="9">85°E</text>
      <text x="605" y="25" fill="#64748B" fontFamily="JetBrains Mono" fontSize="9">90°E</text>
      <text x="765" y="25" fill="#64748B" fontFamily="JetBrains Mono" fontSize="9">95°E</text>
      <text x="8" y="94" fill="#64748B" fontFamily="JetBrains Mono" fontSize="9">25°N</text>
      <text x="8" y="204" fill="#64748B" fontFamily="JetBrains Mono" fontSize="9">20°N</text>
      <text x="8" y="314" fill="#64748B" fontFamily="JetBrains Mono" fontSize="9">15°N</text>
      <text x="8" y="424" fill="#64748B" fontFamily="JetBrains Mono" fontSize="9">10°N</text>

      {/* Region names */}
      <text x="350" y="240" fill="#475569" fontFamily="Inter" fontSize="11" fontWeight="600" letterSpacing="2">
        PENINSULAR INDIA
      </text>
      <text x="650" y="360" fill="#38BDF8" fontFamily="Inter" fontSize="12" fontWeight="600" letterSpacing="3" opacity="0.6">
        BAY OF BENGAL
      </text>
      <text x="180" y="420" fill="#38BDF8" fontFamily="Inter" fontSize="11" fontWeight="600" letterSpacing="2" opacity="0.4">
        ARABIAN SEA
      </text>
    </svg>
  );
}
