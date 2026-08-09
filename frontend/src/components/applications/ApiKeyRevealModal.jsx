import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

/**
 * Shown exactly once, right after an application is created or a secret/key
 * is rotated — the raw value is never retrievable from the API again after
 * this, so the copy affordance matters more here than anywhere else in the
 * dashboard.
 */
export function ApiKeyRevealModal({ title, fields, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="mb-4 text-sm text-danger">
        Copy these now — for your security, they won't be shown again.
      </p>
      <div className="flex flex-col gap-3">
        {fields.map((field) => (
          <SecretField key={field.label} label={field.label} value={field.value} />
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}

function SecretField({ label, value }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2">
        <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-text">{value}</code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 text-xs font-medium text-accent hover:underline"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
