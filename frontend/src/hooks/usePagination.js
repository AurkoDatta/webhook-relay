import { useState } from 'react';

/**
 * Tracks the current page for a filtered list. The backend is the source
 * of truth for `totalPages` (returned alongside each page of results) —
 * this hook only owns which page the user has navigated to.
 */
export function usePagination(pageSize = 20) {
  const [page, setPage] = useState(1);
  return { page, pageSize, setPage };
}
