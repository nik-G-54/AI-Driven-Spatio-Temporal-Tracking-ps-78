import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getSystemStatus, type SystemStatus } from './shared.api';

// Shared layout wrapping every routed page.
export default function AppShell() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    let ignore = false;
    getSystemStatus().then((result) => {
      if (!ignore) setStatus(result);
    });
    return () => {
      ignore = true;
    };
  }, []);

  if (!status) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <>
      <Sidebar status={status} />
      <div className="pl-[248px]">
        <Outlet />
      </div>
    </>
  );
}
