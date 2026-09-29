import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './shared/AppShell';
import Dashboard from './dashboard/Dashboard';
import EventMonitor from './event-monitor/EventMonitor';
import EventDetails from './event-details/EventDetails';
import ModelAnalysis from './model-analysis/ModelAnalysis';
import HistoricalReplay from './historical-replay/HistoricalReplay';
import Retrospective from './retrospective/Retrospective';

const App = () => {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/event-monitor" element={<EventMonitor />} />
        <Route path="/event-details" element={<EventDetails />} />
        <Route path="/event-details/:eventId" element={<EventDetails />} />
        <Route path="/model-analysis" element={<ModelAnalysis />} />
        <Route path="/historical-replay" element={<HistoricalReplay />} />
        <Route path="/retrospective" element={<Retrospective />} />
        <Route path="/retrospective/:caseId" element={<Retrospective />} />
      </Route>
    </Routes>
  )
}

export default App
