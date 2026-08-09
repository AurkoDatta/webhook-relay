import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../common/Card';
import { formatDate } from '../../utils/formatters';

const SUCCESS_COLOR = '#3ddc84';

/**
 * Success rate over the last 14 days. A single series (percentage), so no
 * legend is needed — the card title already says what's plotted. One axis
 * (percent), not two: latency/failure-count live on the endpoint chart
 * instead of being crammed onto this one.
 */
export function SuccessRateChart({ series }) {
  const data = series.map((point) => {
    const total = point.success + point.failure;
    return {
      date: point.date,
      rate: total === 0 ? null : Math.round((point.success / total) * 1000) / 10,
    };
  });

  return (
    <Card className="p-5">
      <h3 className="mb-1 font-display text-sm font-medium text-text">Delivery success rate</h3>
      <p className="mb-4 text-xs text-text-muted">Share of delivery attempts that succeeded, last 14 days</p>
      {data.length === 0 ? (
        <EmptyChartState />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="successRateFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SUCCESS_COLOR} stopOpacity={0.18} />
                <stop offset="100%" stopColor={SUCCESS_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2a3138" strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDate(value).split(',')[0]}
              tick={{ fill: '#8b949c', fontSize: 11 }}
              axisLine={{ stroke: '#2a3138' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: '#8b949c', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{ background: '#1f252b', border: '1px solid #2a3138', borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: '#8b949c' }}
              itemStyle={{ color: '#e7eaed' }}
              formatter={(value) => [`${value}%`, 'Success rate']}
              labelFormatter={(value) => formatDate(value)}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke={SUCCESS_COLOR}
              strokeWidth={2}
              fill="url(#successRateFill)"
              connectNulls
              dot={false}
              activeDot={{ r: 4, fill: SUCCESS_COLOR, stroke: '#171b1f', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

function EmptyChartState() {
  return <p className="py-16 text-center text-sm text-text-muted">No delivery attempts recorded yet.</p>;
}
