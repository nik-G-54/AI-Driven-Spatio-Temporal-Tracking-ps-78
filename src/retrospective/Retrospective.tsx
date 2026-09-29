import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getWeatherAnalysis,
  listWeatherScenarios,
  resolveScenarioId,
  type WeatherAnalysis,
  type WeatherScenarioOption,
} from './analysis/analysis.adapter';
import { getSatelliteContext, type SatelliteContext } from './satellite/satellite.api';
import { formatTimestamp } from './retrospective.utils';
import RetrospectiveHeader from './components/RetrospectiveHeader';
import WeatherEventSelector from './components/WeatherEventSelector';
import EventHeader from './components/EventHeader';
import TimeStepSelector from './components/TimeStepSelector';
import WeatherAnalysisWorkspace from './components/WeatherAnalysisWorkspace';

type LoadState =
  | { status: 'loading'; scenarioId: string }
  | { status: 'error'; scenarioId: string }
  | { status: 'ready'; scenarioId: string; analysis: WeatherAnalysis };

// Extreme-weather analysis page (route kept as /retrospective for compatibility).
// Scenario id = route param: events served through the weather-analysis adapter
// (backend mock API adapters + retrospective case 01).
export default function Retrospective() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const scenarioId = caseId ? resolveScenarioId(caseId) : null;

  const [scenarios, setScenarios] = useState<WeatherScenarioOption[]>([]);
  const [state, setState] = useState<LoadState | null>(null);

  useEffect(() => {
    let ignore = false;
    listWeatherScenarios().then((result) => {
      if (!ignore) setScenarios(result);
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Old case ids (case-b-heatwave, case-c-cyclone) redirect to their replacement scenario.
  useEffect(() => {
    if (caseId && scenarioId && scenarioId !== caseId) navigate(`/retrospective/${scenarioId}`, { replace: true });
  }, [caseId, scenarioId, navigate]);

  useEffect(() => {
    if (!scenarioId) return;
    let ignore = false;
    getWeatherAnalysis(scenarioId)
      .then((analysis) => {
        if (!ignore) setState({ status: 'ready', scenarioId, analysis });
      })
      .catch(() => {
        if (!ignore) setState({ status: 'error', scenarioId });
      });
    return () => {
      ignore = true;
    };
  }, [scenarioId]);

  // Derived: a stale result for a previous scenario counts as loading.
  const current = scenarioId && state?.scenarioId === scenarioId ? state : scenarioId ? ({ status: 'loading', scenarioId } as const) : null;

  return (
    <main className="relative min-h-screen bg-[#070B10]">
      <div className="max-w-[1680px] mx-auto px-5 py-5">
        <div className="flex flex-col w-full gap-3">
          <RetrospectiveHeader />
          <WeatherEventSelector scenarios={scenarios} selectedScenarioId={scenarioId} onSelect={(id: string) => navigate(`/retrospective/${id}`)} />

          {current === null && <Message text="Select a weather event to begin analysis." />}
          {current?.status === 'loading' && <Message text="Loading weather event..." />}
          {current?.status === 'error' && <Message text="Unable to load weather event." tone="error" />}
          {current?.status === 'ready' && <AnalysisBody key={current.scenarioId} analysis={current.analysis} />}
        </div>
      </div>
    </main>
  );
}

function AnalysisBody({ analysis }: { analysis: WeatherAnalysis }) {
  const primary = analysis.variables.find((v) => v.meta.id === analysis.defaultVariable) ?? analysis.variables[0];
  // Start at the step where the simulated AI peak is highest.
  const [frameIndex, setFrameIndex] = useState(() =>
    primary.evolution.reduce((best, e, i, all) => (e.aiPeak > all[best].aiPeak ? i : best), 0),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [satellite, setSatellite] = useState<SatelliteContext | null>(null);
  const lastIndex = analysis.steps.length - 1;

  // Retrospective case 01 only: its simulated satellite-alignment demonstration (secondary context).
  const isCase01 = analysis.event.source === 'retrospective-prototype';
  useEffect(() => {
    if (!isCase01) return;
    let ignore = false;
    const steps = analysis.steps.map((s) => ({ leadTimeHours: s.leadTimeHours, times: { nwp: s.timestamp, ai: s.timestamp, reference: s.timestamp } }));
    getSatelliteContext({ caseId: analysis.event.scenarioId, caseKind: 'synthetic_prototype', steps })
      .then((result) => {
        if (!ignore) setSatellite(result);
      })
      .catch(() => {
        if (!ignore) setSatellite(null);
      });
    return () => {
      ignore = true;
    };
  }, [analysis, isCase01]);

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

  const validTime = analysis.steps[frameIndex]?.timestamp;
  return (
    <>
      <EventHeader event={analysis.event} />
      <TimeStepSelector
        frames={analysis.steps}
        selectedIndex={frameIndex}
        onSelect={selectFrame}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        validTime={validTime ? formatTimestamp(validTime) : undefined}
      />
      <WeatherAnalysisWorkspace analysis={analysis} frameIndex={frameIndex} onSelectFrame={selectFrame} satellite={satellite} />
    </>
  );
}

function Message({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'error' }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        tone === 'error'
          ? 'p-6 border border-[#EF4444]/50 bg-[#EF4444]/10 text-[#FCA5A5] font-mono text-[12px]'
          : 'p-6 bg-[#0B1117] border border-[#1F2A36] text-[#8794A4] font-mono text-[12px]'
      }
    >
      {text}
    </div>
  );
}
