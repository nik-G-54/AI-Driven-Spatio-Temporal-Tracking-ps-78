import { NavLink } from 'react-router-dom';
import { classNames } from './ui/classNames';
import type { SystemStatus } from './shared.api';

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
  return (
    <aside className="fixed left-0 top-0 h-screen w-[248px] bg-[#0B1220] border-r border-[#1E293B] z-50 flex flex-col justify-between p-4 select-none">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 pb-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#131B2E] border border-[#565E74]/30 flex items-center justify-center text-[#DAE2FD]">
              <span className="material-symbols-outlined text-[20px]">grid_guides</span>
            </div>
            <div>
              <div className="text-headline-sm text-white tracking-tight leading-none text-[13px]">
                {status.branding.title}
              </div>
              <div className="text-label-sm text-[#94A3B8] tracking-widest text-[10px] mt-0.5">
                {status.branding.subtitle}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="inline-flex items-center font-mono text-[10px] px-2 py-0.5 rounded bg-[#172554] text-[#93C5FD] border border-[#1E40AF]">
              {status.branding.mode}
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              <span className="text-label-sm text-[#64748B] text-[10px] tracking-wider uppercase px-2 mb-1">
                {section.label}
              </span>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center justify-between px-2.5 py-1.5 rounded transition-colors',
                      isActive
                        ? 'bg-[#1E293B] text-white border-l-[3px] border-[#60A5FA] font-medium'
                        : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white',
                    )
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    <span className="text-body-sm text-[13px]">{item.label}</span>
                  </div>
                  {item.path === '/event-monitor' && status.navBadges.eventMonitorSevereCount > 0 && (
                    <span className="inline-flex items-center text-label-sm text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-[#FCA5A5] border border-red-500/40">
                      {status.navBadges.eventMonitorSevereCount} SEVERE
                    </span>
                  )}
                  {item.path === '/event-details' && (
                    <span className="font-mono text-[10px] text-[#64748B]">
                      {status.navBadges.eventDetailsThroughput}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}

          <div className="flex flex-col gap-1">
            <span className="text-label-sm text-[#64748B] text-[10px] tracking-wider uppercase px-2 mb-1">
              SYSTEM
            </span>
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded text-[#94A3B8]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">database</span>
                <span className="text-body-sm text-[13px]">Data Sources</span>
              </div>
              <span className="font-mono text-[9px] text-[#64748B]">{status.navBadges.dataSourcesTag}</span>
            </div>
          </div>
        </nav>
      </div>

      <div className="pt-4 border-t border-[#1E293B] flex flex-col gap-2 font-mono text-[11px] text-[#64748B]">
        <div className="flex items-center justify-between">
          <span className="text-[#94A3B8]">{status.pipeline.name}</span>
          <span className="text-[#4ADE80] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
            {status.pipeline.status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#94A3B8]">Cycle</span>
          <span className="text-white font-medium">{status.pipeline.cycle}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#94A3B8]">Latency</span>
          <span className="text-[#CBD5E1]">{status.pipeline.latencyMs}ms</span>
        </div>
      </div>
    </aside>
  );
}
