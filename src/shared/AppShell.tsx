import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import { getSystemStatus, type SystemStatus } from './shared.api';

// Shared layout wrapping every routed page. Must not import from any
// page module (dashboard/, event-monitor/, etc.) — only the reverse
// is allowed.
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
    return <div className="min-h-screen bg-[#F8FAFC]" />;
  }

  return (
    <>
      <Sidebar status={status} />
      <div className="pl-[248px]">
        <TopHeader status={status} />
        <div className="pt-[68px]">
          <Outlet />
        </div>
      </div>
    </>
  );
}
