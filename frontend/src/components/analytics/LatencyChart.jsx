import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../common/Card';
import { formatEndpointLabel, formatLatency, formatPercent } from '../../utils/formatters';

const LATENCY_COLOR = '#4fc3f7';
const FAILURE_COLOR = '#ff5d5d';

const tickStyle = { fill: '#8b949c', fontSize: 11 };
const tooltipStyle = { background: '#1f252b', border: '1px solid #2a3138', borderRadius: 6, fontSize: 12 };

/**
 * Per-endpoint average latency and failure rate. These are two different
 * measures on two different scales (milliseconds vs. a percentage), so
 * they're rendered as two single-axis small multiples sharing the same
 * endpoint category axis, rather than one chart with two y-scales.
 */
export function LatencyChart({ perEndpoint }) {
  const data = perEndpoint.map((row) => ({
    endpoint: formatEndpointLabel(row.url),
    avgLatencyMs: Math.round(row.avgLatencyMs),
    failureRatePct: Math.round(row.failureRate * 1000) / 10,
    totalAttempts: row.totalAttempts,
  }));

  if (data.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="mb-4 font-display text-sm font-medium text-text">Per-endpoint performance</h3>
        <p className="py-16 text-center text-sm text-text-muted">No endpoints yet.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="mb-1 font-display text-sm font-medium text-text">Average latency</h3>
        <p className="mb-4 text-xs text-text-muted">Per subscriber endpoint</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid stroke="#2a3138" vertical={false} />
            <XAxis dataKey="endpoint" tick={tickStyle} axisLine={{ stroke: '#2a3138' }} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#8b949c' }}
              formatter={(value) => [formatLatency(value), 'Avg latency']}
            />
            <Bar dataKey="avgLatencyMs" fill={LATENCY_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5">
        <h3 className="mb-1 font-display text-sm font-medium text-text">Failure rate</h3>
        <p className="mb-4 text-xs text-text-muted">Share of attempts that failed, per endpoint</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid stroke="#2a3138" vertical={false} />
            <XAxis dataKey="endpoint" tick={tickStyle} axisLine={{ stroke: '#2a3138' }} tickLine={false} />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              tick={tickStyle}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#8b949c' }}
              formatter={(value) => [formatPercent(value / 100), 'Failure rate']}
            />
            <Bar dataKey="failureRatePct" fill={FAILURE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
