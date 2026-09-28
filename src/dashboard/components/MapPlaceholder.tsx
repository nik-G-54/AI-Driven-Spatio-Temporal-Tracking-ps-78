import { useState } from 'react';
import type { GeoDomain, ActiveAnomaly } from '../dashboard.api';

interface MapPlaceholderProps {
  domain?: GeoDomain;
  anomalies: ActiveAnomaly[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export default function MapPlaceholder({ anomalies }: MapPlaceholderProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  // Derive unique filter options dynamically from data
  const severityOptions = ['All', ...Array.from(new Set(anomalies.map((a) => a.severity).filter(Boolean)))];
  const typeOptions = ['All', ...Array.from(new Set(anomalies.map((a) => a.type).filter(Boolean)))];

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-5 shadow-xs flex flex-col gap-4 w-full select-none transition-colors duration-200">
      {/* 1. Header Title */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-headline-sm font-bold text-foreground">
            Weather Anomaly Overview
          </h2>
        </div>
      </div>

      {/* 2. Map Filter Controls Bar */}
      <div className="flex items-center flex-wrap gap-2.5 font-mono text-[12px]">
        {/* Severity Select */}
        <div className="relative inline-flex items-center">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="appearance-none h-8 pl-3 pr-7 bg-muted/80 border border-border rounded-md text-foreground font-medium hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
          >
            {severityOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-card text-card-foreground">
                Severity: {opt}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[16px] text-muted-foreground absolute right-2 pointer-events-none">
            expand_more
          </span>
        </div>

        {/* Anomaly Type Select */}
        <div className="relative inline-flex items-center">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="appearance-none h-8 pl-3 pr-7 bg-muted/80 border border-border rounded-md text-foreground font-medium hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
          >
            {typeOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-card text-card-foreground capitalize">
                Anomaly Type: {opt}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[16px] text-muted-foreground absolute right-2 pointer-events-none">
            expand_more
          </span>
        </div>
      </div>

      {/* 3. Inner Map Canvas Box */}
      <div className="relative w-full min-h-[420px] rounded-lg border border-border bg-muted/30 overflow-hidden flex flex-col justify-between p-5">
        {/* Tactical graticule grid pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--border) 1px, transparent 1px),
              linear-gradient(to bottom, var(--border) 1px, transparent 1px)
            `,
            backgroundSize: '36px 36px',
          }}
        />

        {/* Top inner map meta */}
        <div className="relative z-10 flex items-center justify-end font-mono text-[11px] text-muted-foreground">
          <span className="text-primary font-semibold">{anomalies.length} Tracked Anomalies</span>
        </div>

        {/* Center MAP Slot */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center my-8">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-3 shadow-xs text-primary">
            <span className="material-symbols-outlined text-[32px]">map</span>
          </div>

          <h3 className="text-xl font-bold tracking-widest text-foreground uppercase font-mono">
            MAP
          </h3>

          <p className="text-body-sm text-muted-foreground max-w-md mt-1 font-mono">
            Reusable Spatial Weather Anomaly Map Component Slot
          </p>

          <div className="mt-4 px-3.5 py-1.5 rounded-full bg-accent border border-border inline-flex items-center gap-2 text-[11px] font-mono text-accent-foreground font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Integration Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
