import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getRetrospectiveCase,
  getRetrospectiveCases,
  type RetrospectiveCase,
  type RetrospectiveCaseOption,
} from './retrospective.api';
import { formatConfidence, sharedScale } from './retrospective.utils';
import RetrospectiveHeader from './components/RetrospectiveHeader';
import CaseSelector from './components/CaseSelector';
import CaseOverview from './components/CaseOverview';
import FieldPanel from './components/FieldPanel';
import ValidationPanel from './components/ValidationPanel';

type LoadState =
  | { status: 'loading'; caseId: string }
  | { status: 'error'; caseId: string }
  | { status: 'ready'; caseId: string; data: RetrospectiveCase };

export default function Retrospective() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [cases, setCases] = useState<RetrospectiveCaseOption[]>([]);
  const [state, setState] = useState<LoadState | null>(null);

  useEffect(() => {
    let ignore = false;
    getRetrospectiveCases().then((result) => {
      if (!ignore) setCases(result);
    });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!caseId) return;
    let ignore = false;
    getRetrospectiveCase(caseId)
      .then((data) => {
        if (!ignore) setState({ status: 'ready', caseId, data });
      })
      .catch(() => {
        if (!ignore) setState({ status: 'error', caseId });
      });
    return () => {
      ignore = true;
    };
  }, [caseId]);

  // Derived: a stale result for a previous case counts as loading.
  const current = caseId && state?.caseId === caseId ? state : caseId ? ({ status: 'loading', caseId } as const) : null;

  return (
    <main className="relative min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-7 py-6">
        <div className="flex flex-col w-full gap-5">
          <RetrospectiveHeader />
          <CaseSelector
            cases={cases}
            selectedCaseId={caseId ?? null}
            onSelectCase={(id) => navigate(`/retrospective/${id}`)}
          />

          {current === null && <Message text="Select a historical case to begin analysis." />}
          {current?.status === 'loading' && <Message text="Loading retrospective case..." />}
          {current?.status === 'error' && <Message text="Unable to load retrospective case." tone="error" />}
          {current?.status === 'ready' && <CaseBody data={current.data} />}
        </div>
      </div>
    </main>
  );
}

function CaseBody({ data }: { data: RetrospectiveCase }) {
  const scale = sharedScale([data.nwp.field, data.ai.field, data.reference.field]);

  return (
    <>
      <CaseOverview info={data.info} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <FieldPanel
          title="Forecast (NWP)"
          origin={data.nwp.source}
          variable={data.nwp.variable}
          timestamp={data.nwp.timestamp}
          field={data.nwp.field}
          scale={scale}
          provenance={data.nwp.provenance}
          extra={[{ label: 'Lead time', value: `T-${data.nwp.leadTimeHours}h` }]}
        />
        <FieldPanel
          title="AI output"
          origin={data.ai.model}
          variable={data.ai.variable}
          timestamp={data.ai.timestamp}
          field={data.ai.field}
          scale={scale}
          provenance={data.ai.provenance}
          extra={[{ label: 'Confidence', value: formatConfidence(data.ai.confidence) }]}
        />
      </div>

      <FieldPanel
        title="Reference"
        origin={data.reference.source}
        variable={data.reference.variable}
        timestamp={data.reference.timestamp}
        field={data.reference.field}
        scale={scale}
        provenance={data.reference.provenance}
      />

      <ValidationPanel metrics={data.validation} detection={data.detection} />
    </>
  );
}

function Message({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'error' }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        tone === 'error'
          ? 'p-6 rounded-xl border border-red-200 bg-red-50 text-[#B91C1C] text-body-md'
          : 'p-6 rounded-xl bg-white shadow-sm text-[#475569] text-body-md'
      }
    >
      {text}
    </div>
  );
}
