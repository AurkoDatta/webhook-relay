const inputClass =
  'rounded-md border border-border bg-bg px-2.5 py-1.5 text-xs text-text placeholder:text-text-faint focus:border-accent focus:outline-none';

/** Event-type + date-range filters for the event list. Controlled by the parent, which owns the filter state and re-fetches on change. */
export function EventFilterBar({ filters, onChange }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value, page: 1 });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Filter by event type…"
        value={filters.eventType ?? ''}
        onChange={(event) => update('eventType', event.target.value)}
        className={`${inputClass} w-48 font-mono`}
      />
      <label className="flex items-center gap-1.5 text-xs text-text-muted">
        from
        <input
          type="datetime-local"
          value={filters.from ?? ''}
          onChange={(event) => update('from', event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs text-text-muted">
        to
        <input
          type="datetime-local"
          value={filters.to ?? ''}
          onChange={(event) => update('to', event.target.value)}
          className={inputClass}
        />
      </label>
    </div>
  );
}
