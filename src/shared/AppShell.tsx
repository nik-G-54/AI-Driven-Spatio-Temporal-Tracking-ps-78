import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getSystemStatus, type SystemStatus } from './shared.api';
import systemStatusDefault from '../mockData/shared/systemStatus.json';

// Shared layout wrapping every routed page.
export default function AppShell() {
  const [status, setStatus] = useState<SystemStatus>(systemStatusDefault as SystemStatus);

  useEffect(() => {
    let ignore = false;
    getSystemStatus()
      .then((result) => {
        if (!ignore && result) setStatus(result);
      })
      .catch((err) => {
        console.warn('[AppShell] Failed to load system status:', err);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <Sidebar status={status} />
      <div className="pl-[248px]">
        <Outlet />
      </div>
    </div>
  );
}
