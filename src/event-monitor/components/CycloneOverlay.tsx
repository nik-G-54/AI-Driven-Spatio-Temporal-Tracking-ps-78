import type { SimulatedCycloneData } from '../mockCycloneData';

interface CycloneOverlayProps {
  data: SimulatedCycloneData;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
  visibleLayers: {
    event: boolean;
    eventTrack: boolean;
    influenceRegion: boolean;
  };
  svgWidth?: number;
  svgHeight?: number;
  projectGeo: (lat: number, lon: number) => { x: number; y: number };
}

export default function CycloneOverlay({
  data,
  isHovered,
  isSelected,
  onHover,
  onClick,
  visibleLayers,
  projectGeo,
}: CycloneOverlayProps) {
  const centerSvg = projectGeo(data.latitude, data.longitude);

  const trackPointsSvg = data.track.map((pt) => ({
    ...pt,
    svg: projectGeo(pt.lat, pt.lon),
  }));

  const trackPathD = trackPointsSvg
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.svg.x},${pt.svg.y}`)
    .join(' ');

  return (
    <g className="select-none cursor-pointer">
      {/* 1. INFLUENCE REGION (Semi-transparent circular/oval localized anomaly zone) */}
      {visibleLayers.influenceRegion && (
        <g>
          <ellipse
            cx={centerSvg.x}
            cy={centerSvg.y}
            rx={isHovered || isSelected ? 115 : 100}
            ry={isHovered || isSelected ? 95 : 80}
            fill="#d97706"
            fillOpacity={isHovered ? 0.18 : 0.12}
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            className="transition-all duration-300"
          />
          <ellipse
            cx={centerSvg.x}
            cy={centerSvg.y}
            rx={isHovered ? 70 : 60}
            ry={isHovered ? 55 : 45}
            fill="#dc2626"
            fillOpacity="0.1"
            stroke="#ef4444"
            strokeWidth="1"
          />
        </g>
      )}

      {/* 2. EVENT TRACK (Curved T-12h -> T-6h -> T-3h -> NOW) */}
      {visibleLayers.eventTrack && (
        <g>
          <path
            d={trackPathD}
            fill="none"
            stroke={isHovered || isSelected ? '#f43f5e' : '#fb7185'}
            strokeWidth={isHovered ? 3.5 : 2.5}
            strokeLinecap="round"
            strokeDasharray={isHovered ? 'none' : '4 2'}
            className="transition-all duration-300"
          />
          {trackPointsSvg.map((pt) => {
            const isNow = pt.timestamp === 'NOW';
            if (isNow) return null;
            return (
              <g key={pt.timestamp} transform={`translate(${pt.svg.x}, ${pt.svg.y})`}>
                <circle cx="0" cy="0" r="3.5" fill="#1e1b4b" stroke="#f43f5e" strokeWidth="1.5" />
                <text
                  x="8"
                  y="3"
                  fill="#94a3b8"
                  fontFamily="'Geist Mono', monospace"
                  fontSize="9"
                  fontWeight="600"
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* 3. CYCLONIC SPIRAL STRUCTURE (Scientific radar spiral arcs) */}
      {visibleLayers.event && (
        <g
          transform={`translate(${centerSvg.x}, ${centerSvg.y})`}
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          {/* Outer Rotating Spiral Arcs */}
          <g className="animate-spin" style={{ animationDuration: '24s', transformOrigin: '0 0' }}>
            <path
              d="M 0,0 Q 25,-15 45,-5 Q 60,10 40,35 Q 10,45 -20,30 Q -40,10 -25,-25 Q 0,-45 35,-30"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeOpacity="0.6"
              strokeLinecap="round"
            />
            <path
              d="M 0,0 Q -20,20 -40,10 Q -50,-10 -30,-35 Q -10,-45 20,-30"
              fill="none"
              stroke="#ea580c"
              strokeWidth="1.2"
              strokeOpacity="0.5"
              strokeLinecap="round"
            />
          </g>

          {/* Inner Counter Spiral Arcs */}
          <g className="animate-spin" style={{ animationDuration: '14s', animationDirection: 'reverse', transformOrigin: '0 0' }}>
            <path
              d="M 0,0 Q 15,10 25,-5 Q 20,-25 -5,-25 Q -25,-15 -15,15"
              fill="none"
              stroke="#dc2626"
              strokeWidth="1.8"
              strokeOpacity="0.75"
              strokeLinecap="round"
            />
          </g>

          {/* 4. EVENT CENTER MARKER (Restrained amber/orange center dot + soft glow + thin circular boundary) */}
          <circle
            cx="0"
            cy="0"
            r={isHovered ? 28 : 22}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.7"
          />
          <circle
            cx="0"
            cy="0"
            r={isHovered ? 14 : 11}
            fill="#d97706"
            fillOpacity="0.3"
            stroke="#f59e0b"
            strokeWidth="1.8"
            className="animate-pulse"
          />
          <circle cx="0" cy="0" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />

          {/* 5. COMPACT FLOATING EVENT LABEL */}
          <g transform="translate(18, -24)">
            <rect
              width="175"
              height="44"
              rx="6"
              fill="#1e1b4b"
              fillOpacity="0.94"
              stroke={isSelected ? '#4f46e5' : '#312e81'}
              strokeWidth={isSelected ? '2' : '1'}
              className="shadow-xl"
            />
            <rect width="3" height="44" rx="1.5" fill="#f59e0b" />

            <text x="10" y="14" fill="#fef08a" fontFamily="'Geist Mono', monospace" fontSize="9" fontWeight="800" letterSpacing="0.05em">
              CYCLONE ANOMALY • {data.severity}
            </text>

            <text x="10" y="27" fill="#ffffff" fontFamily="'Geist Mono', monospace" fontSize="10" fontWeight="700">
              Confidence {(data.confidence * 100).toFixed(0)}% • {data.statusLabel}
            </text>

            <text x="10" y="38" fill="#94a3b8" fontFamily="'Geist Mono', monospace" fontSize="8">
              Bay of Bengal ({data.latitude}°N, {data.longitude}°E)
            </text>
          </g>
        </g>
      )}
    </g>
  );
}
