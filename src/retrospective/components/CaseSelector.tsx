import type { RetrospectiveCaseOption } from '../retrospective.types';
import { classNames } from '../retrospective.utils';

interface CaseSelectorProps {
  cases: RetrospectiveCaseOption[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
}

export default function CaseSelector({ cases, selectedCaseId, onSelectCase }: CaseSelectorProps) {
  return (
    <section className="flex flex-col gap-2 bg-white p-4 rounded-xl shadow-sm" aria-label="Historical case selection">
      <span className="text-label-sm text-[#64748B] tracking-wider uppercase">Historical case selection</span>
      <div className="flex flex-wrap items-center gap-2">
        {cases.map((option) => {
          const isSelected = option.caseId === selectedCaseId;
          return (
            <button
              key={option.caseId}
              type="button"
              onClick={() => onSelectCase(option.caseId)}
              aria-pressed={isSelected}
              className={classNames(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-label-md transition-colors',
                isSelected
                  ? 'bg-black text-white font-semibold'
                  : 'bg-[#EFF4FF] text-[#475569] hover:bg-[#E5EEFF] hover:text-[#0F172A]',
              )}
            >
              {option.label}
              {option.isMock && (
                <span
                  className={classNames(
                    'text-[10px] px-1.5 rounded uppercase',
                    isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-[#A16207]',
                  )}
                >
                  Simulated
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
