import { useState } from 'react';
import clsx from 'clsx';

/**
 * Minimal, self-built recursive JSON payload viewer — no external
 * dependency. Objects/arrays are collapsible; primitives are colored by
 * type so a payload's shape is scannable at a glance, matching the rest of
 * the dashboard's data-as-monospace treatment.
 */
export function JsonViewer({ data, rootLabel }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-bg p-3 font-mono text-xs leading-relaxed">
      <JsonNode value={data} label={rootLabel} depth={0} isLast />
    </div>
  );
}

function JsonNode({ label, value, depth, isLast }) {
  const isExpandable = value !== null && typeof value === 'object';
  const [isOpen, setIsOpen] = useState(depth < 2);

  if (!isExpandable) {
    return (
      <div style={{ paddingLeft: depth === 0 ? 0 : 14 }}>
        {label !== undefined && <span className="text-text-muted">"{label}": </span>}
        <PrimitiveValue value={value} />
        {!isLast && <span className="text-text-faint">,</span>}
      </div>
    );
  }

  const entries = Array.isArray(value) ? value.map((v, i) => [i, v]) : Object.entries(value);
  const bracket = Array.isArray(value) ? ['[', ']'] : ['{', '}'];

  if (entries.length === 0) {
    return (
      <div style={{ paddingLeft: depth === 0 ? 0 : 14 }}>
        {label !== undefined && <span className="text-text-muted">"{label}": </span>}
        <span className="text-text-faint">
          {bracket[0]}
          {bracket[1]}
        </span>
        {!isLast && <span className="text-text-faint">,</span>}
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: depth === 0 ? 0 : 14 }}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center gap-1 text-left hover:text-text"
      >
        <span className={clsx('text-text-faint transition-transform', isOpen && 'rotate-90')}>▸</span>
        {label !== undefined && <span className="text-text-muted">"{label}": </span>}
        <span className="text-text-faint">{bracket[0]}</span>
        {!isOpen && <span className="text-text-faint"> … {bracket[1]}</span>}
      </button>
      {isOpen && (
        <>
          {entries.map(([key, val], index) => (
            <JsonNode key={key} label={key} value={val} depth={depth + 1} isLast={index === entries.length - 1} />
          ))}
          <div style={{ paddingLeft: 14 }} className="text-text-faint">
            {bracket[1]}
          </div>
        </>
      )}
      {!isLast && <span className="text-text-faint">,</span>}
    </div>
  );
}

function PrimitiveValue({ value }) {
  if (value === null) return <span className="text-text-faint">null</span>;
  if (typeof value === 'string') return <span className="text-success">"{value}"</span>;
  if (typeof value === 'number') return <span className="text-info">{value}</span>;
  if (typeof value === 'boolean') return <span className="text-accent">{String(value)}</span>;
  return <span>{String(value)}</span>;
}
