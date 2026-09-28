import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './shared/AppShell';
import Dashboard from './dashboard/Dashboard';
import EventMonitor from './event-monitor/EventMonitor';
import EventDetails from './event-details/EventDetails';
import ModelAnalysis from './model-analysis/ModelAnalysis';
import HistoricalReplay from './historical-replay/HistoricalReplay';

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
      </Route>
    </Routes>
  )
}

export default App
