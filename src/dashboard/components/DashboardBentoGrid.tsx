import { BentoGrid, BentoCard } from '../../shared/ui/bento-grid';
import { FileText, Bell, Share2, Calendar, ShieldAlert, Activity, Sparkles } from 'lucide-react';

// Magic UI BentoGrid Template Component tailored for Weather Anomaly Tracking System
export function BentoDemo() {
  const features = [
    {
      Icon: FileText,
      name: "Spatio-Temporal Tracking",
      description: "AI model downscales medium-range ensemble prediction runs to pinpoint extreme weather anomalies.",
      href: "/event-monitor",
      cta: "Inspect Spatial Map",
      className: "col-span-3 lg:col-span-1",
      background: (
        <div className="absolute inset-0 bg-linear-to-br from-primary/15 via-transparent to-transparent opacity-70 pointer-events-none p-6 flex flex-col justify-end">
          <div className="w-full h-24 rounded-lg border border-primary/20 bg-primary/5 p-3 font-mono text-[11px] text-primary flex flex-col justify-between">
            <div className="flex items-center justify-between font-bold">
              <span>ECMWF Ensemble Run</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="text-[10px] text-muted-foreground">Spatial Resolution: 0.1° (~10km)</div>
            <div className="text-foreground font-semibold">T+120h Horizon Target</div>
          </div>
        </div>
      ),
    },
    {
      Icon: Bell,
      name: "Priority Anomaly Alerts",
      description: "Automated severe event prioritization combining ECMWF ensemble agreement and landfall risk windows.",
      href: "/dashboard",
      cta: "View Priority Events",
      className: "col-span-3 lg:col-span-2",
      background: (
        <div className="absolute top-4 right-4 pointer-events-none opacity-20 dark:opacity-30">
          <ShieldAlert className="w-44 h-44 text-destructive" />
        </div>
      ),
    },
    {
      Icon: Share2,
      name: "Model Inter-Comparison",
      description: "Compare GFS vs ECMWF vs AI Inference outputs across precipitation, wind gust, and pressure fields.",
      href: "/model-analysis",
      cta: "Compare Models",
      className: "col-span-3 lg:col-span-2",
      background: (
        <div className="absolute top-4 right-4 pointer-events-none opacity-20 dark:opacity-30">
          <Activity className="w-44 h-44 text-emerald-500" />
        </div>
      ),
    },
    {
      Icon: Calendar,
      name: "Historical Event Replay",
      description: "Replay past cyclone track errors and atmospheric anomaly propagation over historical forecast runs.",
      href: "/historical-replay",
      cta: "Explore Replay",
      className: "col-span-3 lg:col-span-1",
      background: (
        <div className="absolute inset-0 bg-linear-to-tl from-amber-500/15 via-transparent to-transparent opacity-70 pointer-events-none p-6 flex flex-col justify-end">
          <div className="w-full h-24 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 font-mono text-[11px] text-amber-600 dark:text-amber-400 flex flex-col justify-between">
            <div className="flex items-center justify-between font-bold">
              <span>Cyclone Track Replay</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-[10px] text-muted-foreground">Historical Run: Sep 2024</div>
            <div className="font-semibold text-foreground">Track Error: -12.4 km</div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <BentoGrid>
      {features.map((feature, idx) => (
        <BentoCard key={idx} {...feature} />
      ))}
    </BentoGrid>
  );
}

export default BentoDemo;
