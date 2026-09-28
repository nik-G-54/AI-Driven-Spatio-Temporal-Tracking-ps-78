import type { MapBounds, TrackPoint } from '../historical-replay.api';
import { projectCoordinateToMap } from '../historical-replay.utils';

interface TrackLayerProps {
  groundTruth: TrackPoint[];
  aiTrack: TrackPoint[];
  bounds: MapBounds;
  currentFrameIndex: number;
  landfallFrameIndex: number | null;
  svgWidth: number;
  svgHeight: number;
}

export default function TrackLayer({
  groundTruth,
  aiTrack,
  bounds,
  currentFrameIndex,
  landfallFrameIndex,
  svgWidth,
  svgHeight,
}: TrackLayerProps) {
  const visibleGroundTruth = groundTruth.filter((p) => p.frameIndex <= currentFrameIndex);
  const visibleAiTrack = aiTrack.filter((p) => p.frameIndex <= currentFrameIndex);

  const project = (p: TrackPoint) => projectCoordinateToMap(p.latitude, p.longitude, bounds, svgWidth, svgHeight);

  const groundTruthPath = visibleGroundTruth
    .map((p) => {
      const { x, y } = project(p);
      return `${x},${y}`;
    })
    .join(' L ');

  const aiTrackPath = visibleAiTrack
    .map((p) => {
      const { x, y } = project(p);
      return `${x},${y}`;
    })
    .join(' L ');

  const landfallReached = landfallFrameIndex !== null && currentFrameIndex >= landfallFrameIndex;
  const landfallGroundTruthPoint = groundTruth.find((p) => p.frameIndex === landfallFrameIndex);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
    >
      <defs>
        <linearGradient id="aiTrackGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#FF5252" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#BA1A1A" stopOpacity="1" />
          <stop offset="100%" stopColor="#EADDFF" stopOpacity="0.8" />
        </linearGradient>
        <filter id="trackGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {groundTruthPath && (
        <>
          <path d={`M ${groundTruthPath}`} fill="none" stroke="#0B1C30" strokeLinecap="round" strokeWidth="5" />
          <path
            d={`M ${groundTruthPath}`}
            fill="none"
            stroke="#F8FAFC"
            strokeDasharray="6 4"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
        </>
      )}

      {aiTrackPath && (
        <path
          d={`M ${aiTrackPath}`}
          fill="none"
          stroke="url(#aiTrackGradient)"
          strokeLinecap="round"
          strokeWidth="3"
          filter="url(#trackGlow)"
        />
      )}

      {visibleGroundTruth.map((p) => {
        const { x, y } = project(p);
        const isLandfall = p.frameIndex === landfallFrameIndex;
        if (isLandfall) return null;
        return <circle key={p.frameIndex} cx={x} cy={y} r="4.5" fill="#F8FAFC" stroke="#0B1C30" strokeWidth="2" />;
      })}

      {landfallReached && landfallGroundTruthPoint && (
        <g transform={`translate(${project(landfallGroundTruthPoint).x}, ${project(landfallGroundTruthPoint).y})`}>
          <circle r="14" fill="#EF4444" fillOpacity="0.3" className="animate-ping" />
          <circle r="8" fill="#EF4444" stroke="white" strokeWidth="2" />
          <circle r="3" fill="white" />
        </g>
      )}
    </svg>
  );
}
