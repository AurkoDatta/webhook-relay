import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ApplicationTabs } from '../components/applications/ApplicationTabs';
import { StatsSummaryCards } from '../components/analytics/StatsSummaryCards';
import { SuccessRateChart } from '../components/analytics/SuccessRateChart';
import { LatencyChart } from '../components/analytics/LatencyChart';
import * as statsService from '../services/statsService';

/** "Analytics" tab: aggregate totals, success-rate trend, and per-endpoint latency/failure charts. */
export default function Analytics() {
  const { appId } = useParams();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    statsService.getApplicationStats(appId).then(setStats);
  }, [appId]);

  return (
    <AppShell title="Analytics">
      <ApplicationTabs appId={appId} />

      {!stats ? (
        <p className="font-mono text-sm text-text-muted">loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <StatsSummaryCards stats={stats} />
          <SuccessRateChart series={stats.successRateOverTime} />
          <LatencyChart perEndpoint={stats.perEndpoint} />
        </div>
      )}
    </AppShell>
  );
}
