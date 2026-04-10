import { useState, useEffect, memo } from 'react';
import scheduler from '../../utils/taskScheduler';

/**
 * Performance Diagnostics Panel
 *
 * Dev-only panel showing:
 * - Main-process memory (via IPC)
 * - Renderer JS heap (via performance.memory)
 * - Task scheduler queue depths and CPU load estimate
 * - Active workers / cache stats / request timings
 *
 * Toggle with Ctrl+Shift+P
 */
const DiagnosticsPanel = memo(function DiagnosticsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [schedulerStats, setSchedulerStats] = useState(null);
  const [rendererMem, setRendererMem] = useState(null);

  // Toggle panel with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Fetch stats from main process
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;

    const fetchStats = async () => {
        try {
          // Main-process stats via IPC (fixed: was window.electronAPI, now window.api)
          const data = await window.api?.getPerformanceStats?.();
          setStats(data || {});
        } catch (error) {
          console.error('Failed to fetch performance stats:', error);
        }

        // Renderer-side stats (no IPC needed)
        setSchedulerStats(scheduler.getStats());

        if (performance.memory) {
          setRendererMem({
            heapUsedMB:  Math.round(performance.memory.usedJSHeapSize  / 1024 / 1024),
            heapTotalMB: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limitMB:     Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
          });
        }
      };

    fetchStats();
    const interval = setInterval(fetchStats, 2000); // Update every 2s

    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg
                   hover:bg-gray-700 transition-colors text-sm font-mono"
          title="Open diagnostics (Ctrl+Shift+P)"
        >
          📊 Perf
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-auto
                  bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 
                    border-b border-gray-700 sticky top-0">
        <h3 className="font-bold text-sm">Performance Diagnostics</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2 py-1 rounded text-xs ${
              autoRefresh ? 'bg-green-600' : 'bg-gray-600'
            }`}
            title="Toggle auto-refresh"
          >
            {autoRefresh ? '⟳' : '⏸'}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 font-mono text-xs">
        {/* Task Scheduler */}
        {schedulerStats && (
          <Section title="Task Scheduler">
            <Stat label="HIGH queue"   value={schedulerStats.high}   color={schedulerStats.high   > 0 ? 'yellow' : undefined} />
            <Stat label="MEDIUM queue" value={schedulerStats.medium} color={schedulerStats.medium > 0 ? 'yellow' : undefined} />
            <Stat label="LOW queue"    value={schedulerStats.low}    />
            <Stat label="CPU load"     value={`${schedulerStats.cpuLoad}%`}
                  color={schedulerStats.cpuLoad > 70 ? 'red' : schedulerStats.cpuLoad > 40 ? 'yellow' : 'green'} />
            {schedulerStats.throttled && (
              <div className="text-red-400 font-bold">⚠ LOW tasks throttled (CPU busy)</div>
            )}
          </Section>
        )}

        {/* Renderer Heap */}
        {rendererMem && (
          <Section title="Renderer Heap">
            <Stat label="Used"  value={`${rendererMem.heapUsedMB} MB`}
                  color={rendererMem.heapUsedMB > rendererMem.heapTotalMB * 0.85 ? 'red' : 'green'} />
            <Stat label="Total" value={`${rendererMem.heapTotalMB} MB`} />
            <Stat label="Limit" value={`${rendererMem.limitMB} MB`} />
          </Section>
        )}

        {/* Main-process memory */}
        {stats?.process && (
          <Section title="Main Process">
            <Stat label="Heap used"  value={`${stats.process.heapUsedMB} MB`}
                  color={stats.process.heapUsedMB > 200 ? 'red' : 'green'} />
            <Stat label="Heap total" value={`${stats.process.heapTotalMB} MB`} />
            <Stat label="RSS"        value={`${stats.process.rssMB} MB`} />
          </Section>
        )}

        {/* Workers */}
        {stats?.workers && (
          <Section title="Workers">
            <Stat label="Total" value={stats.workers.totalWorkers} />
            <Stat label="Available" value={stats.workers.availableWorkers} color="green" />
            <Stat label="Busy" value={stats.workers.busyWorkers} color="yellow" />
            <Stat label="Pending" value={stats.workers.pendingRequests} />
          </Section>
        )}

        {/* Cache Stats */}
        {stats?.caches && Object.keys(stats.caches).length > 0 && (
          <Section title="Caches">
            {Object.entries(stats.caches).map(([name, cache]) => (
              <div key={name} className="mb-2">
                <div className="text-gray-400 mb-1">{name}</div>
                <div className="pl-2 space-y-1">
                  <Stat label="Size" value={`${cache.size}/${cache.maxSize}`} />
                  <Stat label="Usage" value={cache.utilization} />
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* Requests */}
        {stats?.requests && (
          <Section title="Requests">
            <Stat label="Pending" value={stats.requests.totalPending} />
            {stats.requests.byContext && Object.entries(stats.requests.byContext).map(([ctx, count]) => (
              <Stat key={ctx} label={ctx} value={count} indent />
            ))}
          </Section>
        )}

        {/* Metrics */}
        {stats?.metrics && Object.keys(stats.metrics).length > 0 && (
          <Section title="Timings">
            {Object.entries(stats.metrics).map(([name, metric]) => (
              <div key={name} className="mb-2">
                <div className="text-gray-400 mb-1">{name}</div>
                <div className="pl-2 space-y-1">
                  <Stat label="Avg" value={`${metric.avgDuration}ms`} />
                  <Stat label="Last" value={`${metric.lastDuration}ms`} />
                  <Stat label="Count" value={metric.count} />
                </div>
              </div>
            ))}
          </Section>
        )}

        {stats?.ai?.providerMetrics && (
          <Section title="AI Providers">
            <Stat label="Current" value={stats.ai.currentProvider || 'fallback'} color="green" />
            <Stat label="Budget" value={stats.ai.budgetStatus || 'ok'} color={stats.ai.budgetStatus === 'exhausted' ? 'red' : stats.ai.budgetStatus === 'warning' ? 'yellow' : 'green'} />
            {Object.entries(stats.ai.providerMetrics).map(([name, metric]) => (
              <div key={name} className="mb-3 border-t border-gray-800 pt-2 first:border-t-0 first:pt-0">
                <div className="mb-1 font-semibold text-blue-300">{name}</div>
                <Stat label="Requests" value={metric.requests} />
                <Stat label="Successes" value={metric.successes} color={metric.successes > 0 ? 'green' : undefined} />
                <Stat label="Failures" value={metric.failures} color={metric.failures > 0 ? 'yellow' : undefined} />
                <Stat label="Avg latency" value={`${Math.round(metric.avgLatency || 0)}ms`} />
                <Stat label="Avg confidence" value={(metric.avgConfidence || 0).toFixed(2)} />
                <Stat label="Cost" value={`$${(metric.costEstimate || 0).toFixed(4)}`} />
                {stats.providers?.networkHealth?.[name] && (
                  <Stat
                    label="Health"
                    value={stats.providers.networkHealth[name].unhealthy ? 'cooldown' : 'ok'}
                    color={stats.providers.networkHealth[name].unhealthy ? 'red' : 'green'}
                  />
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-gray-700 text-gray-500 text-center">
          Press Ctrl+Shift+P to toggle
        </div>
      </div>
    </div>
  );
});

// Helper components
function Section({ title, children }) {
  return (
    <div className="border border-gray-700 rounded p-2">
      <div className="font-bold text-blue-400 mb-2">{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, color, indent }) {
  const colorClass = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400'
  }[color] || 'text-white';

  return (
    <div className={`flex justify-between ${indent ? 'pl-4' : ''}`}>
      <span className="text-gray-400">{label}:</span>
      <span className={colorClass}>{value}</span>
    </div>
  );
}

export default DiagnosticsPanel;
