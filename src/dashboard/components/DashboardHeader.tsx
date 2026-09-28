import { Sun, Moon } from 'lucide-react';
import type { DashboardOverview } from '../dashboard.api';
import { useTheme } from '../../shared/useTheme';

interface DashboardHeaderProps {
  overview: DashboardOverview;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function DashboardHeader({ overview, onRefresh, isRefreshing }: DashboardHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border">
      <div className="flex flex-col">
        <h1 className="text-display-md text-foreground font-bold tracking-tight">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center flex-wrap gap-2.5">
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="h-9 px-3 bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg shadow-xs flex items-center gap-2 text-[12px] font-medium transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
          <span className="capitalize">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div className="h-9 px-3 bg-card border border-border text-card-foreground rounded-lg shadow-xs flex items-center gap-2 font-mono text-[12px]">
          <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
          <span className="font-semibold text-foreground">{overview.cycle.label}</span>
        </div>

        <button
          type="button"
          title="Refresh Data Feed"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-9 px-3 bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg shadow-xs flex items-center gap-1.5 text-[12px] font-medium transition-colors focus:outline-none disabled:opacity-60 cursor-pointer"
        >
          <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin' : ''}`}>
            refresh
          </span>
          <span>Refresh</span>
        </button>
      </div>
    </section>
  );
}
