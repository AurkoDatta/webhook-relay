import { useState } from 'react';
import { Button } from '../common/Button';

const inputClass =
  'w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none';

/**
 * Create/edit form for a subscriber endpoint. Event types are entered as a
 * comma-separated list (or "*" for everything) rather than a tag-picker
 * widget — endpoints typically subscribe to a handful of types, so a plain
 * text field is faster to use than building a full multi-select.
 */
export function EndpointForm({ initialValues, onSubmit, onCancel }) {
  const [url, setUrl] = useState(initialValues?.url ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [eventTypesText, setEventTypesText] = useState((initialValues?.subscribedEventTypes ?? ['*']).join(', '));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const subscribedEventTypes = eventTypesText
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean);

    if (subscribedEventTypes.length === 0) {
      setError('Subscribe to at least one event type, or "*" for all events.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ url, description, subscribedEventTypes });
    } catch (err) {
      setError(err.message || 'Could not save the endpoint.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-muted">Target URL</span>
        <input
          type="url"
          required
          autoFocus
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className={inputClass}
          placeholder="https://example.com/webhooks"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-muted">Description (optional)</span>
        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={inputClass}
          placeholder="Primary receiver"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-muted">Event types</span>
        <input
          type="text"
          required
          value={eventTypesText}
          onChange={(event) => setEventTypesText(event.target.value)}
          className={`${inputClass} font-mono`}
          placeholder="user.created, order.paid — or * for all events"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : initialValues ? 'Save changes' : 'Add endpoint'}
        </Button>
      </div>
    </form>
  );
}
