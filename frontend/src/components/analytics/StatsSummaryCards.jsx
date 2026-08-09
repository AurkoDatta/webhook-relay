import { Card } from '../common/Card';
import { formatCompactNumber } from '../../utils/formatters';

/**
 * Headline stat tiles. Deliberately not charts — a handful of totals don't
 * need a plot, just a clearly labeled number (per the "sometimes the
 * answer is a stat tile, not a chart" rule).
 */
export function StatsSummaryCards({ stats }) {
  const queueDepth = (stats.queueDepth.waiting ?? 0) + (stats.queueDepth.delayed ?? 0) + (stats.queueDepth.active ?? 0);

  const tiles = [
    { label: 'Events ingested', value: stats.totalEvents },
    { label: 'Deliveries attempted', value: stats.totalDeliveries },
    { label: 'In queue right now', value: queueDepth },
    { label: 'Permanently failed', value: stats.deliveriesByStatus.failed },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="p-4">
          <p className="text-xs text-text-muted">{tile.label}</p>
          <p className="mt-1 font-sans text-2xl font-semibold text-text">{formatCompactNumber(tile.value)}</p>
        </Card>
      ))}
    </div>
  );
}
