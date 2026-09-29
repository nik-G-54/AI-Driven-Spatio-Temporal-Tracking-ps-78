import { classNames } from '../retrospective.utils';
import { EVENT_TYPE_LABEL, type WeatherEventType, type WeatherScenarioOption } from '../analysis/analysis.types';
import { CAP, PANEL } from './ui';

interface WeatherEventSelectorProps {
  scenarios: WeatherScenarioOption[];
  selectedScenarioId: string | null;
  onSelect: (scenarioId: string) => void;
}

const TYPES: WeatherEventType[] = ['precipitation', 'heatwave', 'cyclone'];

const SOURCE_LABEL: Record<WeatherScenarioOption['source'], string> = {
  'backend-mock-api': 'Backend mock API',
  'retrospective-prototype': 'Retrospective prototype (synthetic)',
};

// Weather event → scenario. One reusable workspace serves every event type.
export default function WeatherEventSelector({ scenarios, selectedScenarioId, onSelect }: WeatherEventSelectorProps) {
  const selected = scenarios.find((s) => s.scenarioId === selectedScenarioId) ?? null;
  const activeType = selected?.eventType ?? null;
  const ofType = (type: WeatherEventType) => scenarios.filter((s) => s.eventType === type);

  return (
    <section className={`${PANEL} flex flex-wrap items-stretch gap-x-6 px-4`} aria-label="Weather event selection">
      <div className="flex items-stretch gap-1" role="group" aria-label="Weather event">
        <span className={`${CAP} self-center mr-2`}>Weather event</span>
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => ofType(type)[0] && onSelect(ofType(type)[0].scenarioId)}
            aria-pressed={activeType === type}
            className={classNames(
              'h-11 px-3.5 text-[12.5px] font-medium border-b-2 transition-colors',
              activeType === type ? 'border-[#38BDF8] text-[#EAF7FE] bg-[#38BDF8]/[0.07]' : 'border-transparent text-[#9BA9B9] hover:text-[#E6EDF4]',
            )}
          >
            {EVENT_TYPE_LABEL[type]}
          </button>
        ))}
      </div>

      {activeType && (
        <label className="flex items-center gap-2">
          <span className={CAP}>Scenario</span>
          <select
            value={selectedScenarioId ?? ''}
            onChange={(event) => onSelect(event.target.value)}
            aria-label="Scenario"
            className="h-7 pl-2 pr-6 bg-[#0F151C] border border-[#2B3846] text-[#D9E1EA] text-[12px] focus:outline-none focus:ring-1 focus:ring-[#38BDF8] max-w-[420px]"
          >
            {ofType(activeType).map((s) => (
              <option key={s.scenarioId} value={s.scenarioId}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {selected && (
        <span className="self-center ml-auto font-mono text-[10px] tracking-[0.06em] uppercase px-2 py-0.5 border border-[#243140] text-[#8794A4]">
          Source · {SOURCE_LABEL[selected.source]}
        </span>
      )}
    </section>
  );
}
