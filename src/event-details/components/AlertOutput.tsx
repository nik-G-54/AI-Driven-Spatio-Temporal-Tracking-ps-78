import { useState } from 'react';
import type { EventAlerts } from '../event-details.api';

interface AlertOutputProps {
  alerts: EventAlerts;
  onCopyJson: () => Promise<void>;
  onExportGeoJson: () => void;
  onSendWebhook: () => void;
}

export default function AlertOutput({ alerts, onCopyJson, onExportGeoJson, onSendWebhook }: AlertOutputProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showStatus = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 2500);
  };

  const payloadText = JSON.stringify(alerts.payload, null, 2);

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm p-5 gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-headline-sm text-[#0F172A]">CAP / REST API Alert Output</h2>
          <span className="text-body-sm text-[#475569]">Structured payload generated from 5 km AI Downscaling</span>
        </div>
        <span className="inline-flex items-center font-mono text-[10px] px-2 py-0.5 rounded bg-[#131B2E] text-[#DAE2FD] font-bold tracking-wide">
          {alerts.status}
        </span>
      </div>

      <div className="relative bg-[#0B1220] p-3.5 rounded-lg overflow-hidden shadow-inner">
        <pre className="font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto">{payloadText}</pre>
      </div>

      {statusMessage && (
        <div className="px-3 py-2 rounded bg-[#DCFCE7] text-[#15803D] text-body-sm font-medium">{statusMessage}</div>
      )}

      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          type="button"
          onClick={async () => {
            await onCopyJson();
            showStatus('CAP Alert JSON copied to clipboard.');
          }}
          className="px-2.5 py-1.5 rounded-md bg-[#EFF4FF] hover:bg-[#E5EEFF] text-[#0F172A] text-label-md flex items-center justify-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">content_copy</span>
          <span>Copy JSON</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onExportGeoJson();
            showStatus(`GeoJSON exported: ${alerts.payload.high_risk_cells_5km} polygon features.`);
          }}
          className="px-2.5 py-1.5 rounded-md bg-[#EFF4FF] hover:bg-[#E5EEFF] text-[#0F172A] text-label-md flex items-center justify-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">shape_line</span>
          <span>Export GeoJSON</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onSendWebhook();
            showStatus('Simulated webhook dispatch acknowledged (demo).');
          }}
          className="px-2.5 py-1.5 rounded-md bg-black hover:bg-[#1e293b] text-white text-label-md flex items-center justify-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">send</span>
          <span>Send Webhook</span>
        </button>
      </div>
    </div>
  );
}
