import { NavLink } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { classNames } from './ui/classNames';
import type { SystemStatus } from './shared.api';
import { useTheme } from './useTheme';

interface SidebarProps {
  status: SystemStatus;
}

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'OVERVIEW',
    items: [{ path: '/dashboard', icon: 'dashboard', label: 'Dashboard' }],
  },
  {
    label: 'MONITORING',
    items: [{ path: '/event-monitor', icon: 'radar', label: 'Event Monitor' }],
  },
  {
    label: 'ANALYSIS',
    items: [
      { path: '/event-details', icon: 'view_column', label: 'Event Details' },
      { path: '/model-analysis', icon: 'neurology', label: 'Model Analysis' },
      { path: '/historical-replay', icon: 'history', label: 'Historical Replay' },
    ],
  },
];

export default function Sidebar({ status }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[248px] bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-50 flex flex-col justify-between p-4 select-none transition-colors duration-200">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 pb-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">grid_guides</span>
            </div>
            <div>
              <div className="text-headline-sm font-bold tracking-tight text-sidebar-foreground text-[13px]">
                {status.branding.title}
              </div>
              <div className="text-label-sm text-muted-foreground tracking-widest text-[10px] mt-0.5 font-mono">
                {status.branding.subtitle}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="inline-flex items-center font-mono text-[10px] px-2 py-0.5 rounded bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border font-semibold">
              {status.branding.mode}
            </span>

            {/* Lucide Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="h-7 px-2 rounded bg-sidebar-accent border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80 flex items-center gap-1.5 font-mono text-[11px] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span className="capitalize">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>

        <nav className="flex flex-col gap-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              <span className="text-label-sm text-muted-foreground text-[10px] tracking-wider uppercase px-2 mb-1 font-mono">
                {section.label}
              </span>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-[13px]',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-l-[3px] border-sidebar-primary shadow-xs'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                    )
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    <span className="text-body-sm font-medium">{item.label}</span>
                  </div>
                  {item.path === '/event-monitor' && status.navBadges.eventMonitorSevereCount > 0 && (
                    <span className="inline-flex items-center font-mono text-[10px] px-1.5 py-0.2 rounded bg-destructive text-destructive-foreground font-bold">
                      {status.navBadges.eventMonitorSevereCount} SEVERE
                    </span>
                  )}
                  {item.path === '/event-details' && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {status.navBadges.eventDetailsThroughput}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}

          <div className="flex flex-col gap-1">
            <span className="text-label-sm text-muted-foreground text-[10px] tracking-wider uppercase px-2 mb-1 font-mono">
              SYSTEM
            </span>
            <div className="flex items-center justify-between px-2.5 py-2 rounded-lg text-sidebar-foreground/80 text-[13px]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">database</span>
                <span className="text-body-sm font-medium">Data Sources</span>
              </div>
              <span className="font-mono text-[9px] text-muted-foreground font-bold">{status.navBadges.dataSourcesTag}</span>
            </div>
          </div>
        </nav>
      </div>

      <div className="pt-4 border-t border-sidebar-border flex flex-col gap-2 font-mono text-[11px] text-muted-foreground">
        <div className="flex items-center justify-between">
          <span className="text-sidebar-foreground/80">{status.pipeline.name}</span>
          <span className="text-emerald-500 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {status.pipeline.status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Cycle</span>
          <span className="text-sidebar-foreground font-semibold">{status.pipeline.cycle}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Latency</span>
          <span className="text-sidebar-foreground/90">{status.pipeline.latencyMs}ms</span>
        </div>
      </div>
    </aside>
  );
}
