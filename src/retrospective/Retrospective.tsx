import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getRetrospectiveCase,
  getRetrospectiveCases,
  type RetrospectiveCase,
  type RetrospectiveCaseOption,
  type TimeStepField,
} from './retrospective.api';
import { formatConfidence, peakFrameIndex, sharedScale } from './retrospective.utils';
import RetrospectiveHeader from './components/RetrospectiveHeader';
import CaseSelector from './components/CaseSelector';
import CaseOverview from './components/CaseOverview';
import FieldPanel from './components/FieldPanel';
import ValidationPanel from './components/ValidationPanel';
import TimeStepSelector from './components/TimeStepSelector';
import PrecipitationWorkspace from './components/PrecipitationWorkspace';

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
          {current?.status === 'ready' && <CaseBody key={current.caseId} data={current.data} />}
        </div>
      </div>
    </main>
  );
}

function CaseBody({ data }: { data: RetrospectiveCase }) {
  // Default to the time step where the simulated reference peaks.
  const [frameIndex, setFrameIndex] = useState(() => peakFrameIndex(data.reference.frames));
  const [isPlaying, setIsPlaying] = useState(false);
  const lastIndex = data.reference.frames.length - 1;
  const isRainfall = data.info.eventType === 'extreme_rainfall';

  // Optional playback: advances the shared time step and stops at the last one.
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setFrameIndex((index) => {
        if (index >= lastIndex) {
          setIsPlaying(false);
          return index;
        }
        return index + 1;
      });
    }, 1600);
    return () => clearInterval(timer);
  }, [isPlaying, lastIndex]);

  // Any manual selection pauses playback.
  const selectFrame = (index: number) => {
    setIsPlaying(false);
    setFrameIndex(index);
  };
  const togglePlay = () => {
    if (!isPlaying && frameIndex >= lastIndex) setFrameIndex(0);
    setIsPlaying(!isPlaying);
  };

  const scale = sharedScale([data.nwp.frames, data.ai.frames, data.reference.frames]);
  const pick = (frames: TimeStepField[]) => frames[Math.min(frameIndex, frames.length - 1)];

  return (
    <>
      <CaseOverview info={data.info} />

      <TimeStepSelector
        frames={data.reference.frames}
        selectedIndex={frameIndex}
        onSelect={selectFrame}
        isPlaying={isPlaying}
        onTogglePlay={isRainfall ? togglePlay : undefined}
      />

      {isRainfall ? (
        <PrecipitationWorkspace data={data} frameIndex={frameIndex} onSelectFrame={selectFrame} />
      ) : (
        <>
          <Message text="The geospatial comparison is implemented for the extreme-precipitation case in this phase." />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <FieldPanel
              title="Forecast (NWP)"
              origin={data.nwp.source}
              variable={data.nwp.variable}
              frame={pick(data.nwp.frames)}
              scale={scale}
              provenance={data.nwp.provenance}
            />
            <FieldPanel
              title="AI output"
              origin={data.ai.model}
              variable={data.ai.variable}
              frame={pick(data.ai.frames)}
              scale={scale}
              provenance={data.ai.provenance}
              extra={[
                { label: 'Model status', value: data.ai.modelStatus },
                { label: 'Confidence', value: formatConfidence(data.ai.confidence) },
              ]}
            />
          </div>
          <FieldPanel
            title="Reference"
            origin={data.reference.source}
            variable={data.reference.variable}
            frame={pick(data.reference.frames)}
            scale={scale}
            provenance={data.reference.provenance}
          />
          <ValidationPanel metrics={data.validation} detection={data.detection} />
        </>
      )}
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
