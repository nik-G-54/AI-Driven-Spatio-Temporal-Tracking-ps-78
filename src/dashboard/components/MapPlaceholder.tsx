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

  const isFiltered = selectedSeverity !== 'All' || selectedType !== 'All';

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-5 shadow-xs flex flex-col gap-4 w-full select-none transition-colors duration-200">
      {/* 1. Header with Title on Left & Visually Impressive Filter Controls on Top Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[22px] text-primary">map</span>
          <h2 className="text-headline-sm font-bold text-foreground tracking-tight">
            Weather Anomaly Overview
          </h2>
        </div>

        {/* Visually Impressive Top-Right Filters */}
        <div className="flex items-center flex-wrap gap-2.5 font-mono text-xs">
          {/* Severity Filter Pill */}
          <div className="relative inline-flex items-center bg-muted/70 hover:bg-muted border border-border hover:border-primary/40 rounded-lg px-2.5 py-1 shadow-xs transition-all cursor-pointer group">
            <span className="material-symbols-outlined text-[15px] text-amber-500 mr-1.5 pointer-events-none">
              warning
            </span>
            <span className="text-muted-foreground text-[11px] font-semibold mr-1">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="appearance-none bg-transparent pr-5 font-bold text-foreground focus:outline-none cursor-pointer text-[12px]"
            >
              {severityOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-card text-card-foreground">
                  {opt}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[16px] text-muted-foreground absolute right-2 pointer-events-none group-hover:text-foreground transition-colors">
              expand_more
            </span>
          </div>

          {/* Anomaly Type Filter Pill */}
          <div className="relative inline-flex items-center bg-muted/70 hover:bg-muted border border-border hover:border-primary/40 rounded-lg px-2.5 py-1 shadow-xs transition-all cursor-pointer group">
            <span className="material-symbols-outlined text-[15px] text-primary mr-1.5 pointer-events-none">
              category
            </span>
            <span className="text-muted-foreground text-[11px] font-semibold mr-1">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="appearance-none bg-transparent pr-5 font-bold text-foreground focus:outline-none cursor-pointer capitalize text-[12px]"
            >
              {typeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-card text-card-foreground capitalize">
                  {opt}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[16px] text-muted-foreground absolute right-2 pointer-events-none group-hover:text-foreground transition-colors">
              expand_more
            </span>
          </div>

          {/* Reset Filters button if active */}
          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setSelectedSeverity('All');
                setSelectedType('All');
              }}
              className="h-7 px-2 bg-accent text-accent-foreground border border-border rounded-md text-[11px] font-bold hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset Filters"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Inner Map Canvas Box */}
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

          <div className="mt-4 px-3.5 py-1.5 rounded-full bg-accent border border-border inline-flex items-center gap-2 text-[11px] font-mono text-accent-foreground font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Integration Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
