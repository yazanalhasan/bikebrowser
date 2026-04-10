import { useEffect, useState } from 'react';
import { CONFIG } from '../../../config/env.js';

export default function ConnectionPanel() {
  const [info, setInfo] = useState(null);
  const [status, setStatus] = useState({ activeCount: 0 });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    window.api?.getConnectionInfo?.().then((data) => {
      if (mounted) {
        setInfo(data);
      }
    }).catch(() => {});

    const timer = setInterval(() => {
      fetch('/api/health')
        .then((res) => {
          if (!res.ok) {
            throw new Error('health check failed');
          }

          return res;
        })
        .catch(() => {
          return fetch(`${CONFIG.API_BASE_URL}/health`, {
            headers: {
              'x-api-key': CONFIG.API_KEY,
            },
          });
        })
        .then((res) => {
          if (res.ok) {
            setConnected(true);
            return;
          }

          throw new Error('health check failed');
        })
        .catch(() => setConnected(false));

      window.api?.getConnectionStatus?.().then((data) => {
        if (mounted && data?.success) {
          setStatus(data);
        }
      }).catch(() => {});
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  if (!info?.webUrl) {
    return null;
  }

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
      <p className="mb-1 font-semibold">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />{' '}
        {connected ? 'Connected to server' : 'Disconnected'}
      </p>
      <p className="font-bold">Open on phone: {info.webUrl}</p>
      <p>API: {info.apiUrl}</p>
      <p>Public URL: {info.publicUrl || CONFIG.PUBLIC_BASE_URL || 'Not configured'}</p>
      <p>Mobile connected: {status.activeCount || 0}</p>
      <p className="mt-1">Open on phone and tap Add to Home Screen.</p>
      {info.qrDataUrl && (
        <img src={info.qrDataUrl} alt="LAN QR" className="mt-2 h-20 w-20 rounded bg-white p-1" />
      )}
    </div>
  );
}
