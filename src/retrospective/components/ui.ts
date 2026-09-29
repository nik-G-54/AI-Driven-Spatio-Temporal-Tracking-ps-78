import { classNames } from '../retrospective.utils';

// Class tokens of the dark operational workbench, shared by the analysis components.
export const PANEL = 'bg-[#0B1117] border border-[#1F2A36]';
export const PANEL_HEAD = 'flex items-center justify-between gap-2 min-h-10 px-3 py-2 border-b border-[#1F2A36]';
export const TITLE = 'font-mono text-[11.5px] font-semibold tracking-[0.08em] uppercase text-[#E6EDF4]';
export const CAP = 'font-mono text-[10px] tracking-[0.1em] uppercase text-[#7F8C9C]';
export const MUTED = 'text-[#8794A4]';
export const SIM_CHIP = 'font-mono text-[9px] tracking-[0.08em] px-1.5 py-[1px] border border-[#7A5A12] text-[#FBBF24] whitespace-nowrap';
export const NOTE = 'text-[11px] leading-snug text-[#E9CF8C] bg-[#FBBF24]/[0.06] border border-[#4A3A12] px-2.5 py-1.5';

export function segment(active: boolean, disabled = false): string {
  return classNames(
    'h-7 px-2.5 border text-[11.5px] font-medium transition-colors -ml-px first:ml-0',
    disabled && 'opacity-35 cursor-not-allowed',
    active
      ? 'relative z-[1] border-[#38BDF8] bg-[#38BDF8]/15 text-[#EAF7FE]'
      : 'border-[#243140] bg-[#0F151C] text-[#A9B6C4] hover:bg-[#15202B] hover:text-[#E6EDF4]',
  );
}
