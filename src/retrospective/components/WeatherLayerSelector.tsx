import { VARIABLE_LABEL, type VariableId } from '../analysis/analysis.types';
import { CAP, PANEL, segment } from './ui';

export type DataView = 'nwp' | 'ai' | 'reference' | 'difference' | 'anomaly' | 'satellite' | 'radar';

export interface DataViewOption {
  id: DataView;
  label: string;
  disabled?: boolean;
  hint?: string;
}

interface WeatherLayerSelectorProps {
  // Variable selector.
  variables: VariableId[];
  variable: VariableId;
  onVariable: (id: VariableId) => void;
  // Comparison / single map view.
  layout: 'single' | 'comparison';
  onLayout: (layout: 'single' | 'comparison') => void;
  // DATA VIEW (single map).
  views: DataViewOption[];
  view: DataView;
  onView: (view: DataView) => void;
}

const CONTEXT_VIEWS: DataView[] = ['satellite', 'radar'];

const Segment = ({ active, disabled, onClick, children, title }: { active: boolean; disabled?: boolean; onClick: () => void; children: string; title?: string }) => (
  <button type="button" disabled={disabled} title={title} onClick={onClick} aria-pressed={active} className={segment(active, disabled)}>
    {children}
  </button>
);

// One control bar: variable · layout · DATA VIEW (analysis layers, then context layers).
export default function WeatherLayerSelector({ variables, variable, onVariable, layout, onLayout, views, view, onView }: WeatherLayerSelectorProps) {
  const analysis = views.filter((v) => !CONTEXT_VIEWS.includes(v.id));
  const context = views.filter((v) => CONTEXT_VIEWS.includes(v.id));
  return (
    <section className={`${PANEL} flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5`} aria-label="Layer controls">
      <div className="flex items-center gap-2" role="group" aria-label="Variable">
        <span className={CAP}>Variable</span>
        <div className="flex">
          {variables.map((id) => (
            <Segment key={id} active={variable === id} onClick={() => onVariable(id)}>
              {VARIABLE_LABEL[id]}
            </Segment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2" role="group" aria-label="Map layout">
        <span className={CAP}>Layout</span>
        <div className="flex">
          <Segment active={layout === 'single'} onClick={() => onLayout('single')}>
            Single map
          </Segment>
          <Segment active={layout === 'comparison'} onClick={() => onLayout('comparison')}>
            Comparison
          </Segment>
        </div>
      </div>

      {layout === 'single' && (
        <>
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Analysis layer">
            <span className={CAP}>Analysis</span>
            <div className="flex">
              {analysis.map((option) => (
                <Segment key={option.id} active={view === option.id} disabled={option.disabled} title={option.hint} onClick={() => onView(option.id)}>
                  {option.label}
                </Segment>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Context layer">
            <span className={CAP}>Context</span>
            <div className="flex">
              {context.map((option) => (
                <Segment key={option.id} active={view === option.id} disabled={option.disabled} title={option.hint} onClick={() => onView(option.id)}>
                  {option.label}
                </Segment>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
