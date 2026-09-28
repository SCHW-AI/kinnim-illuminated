import { useEffect } from 'react';

const SITE = 'Kinnim Illuminated';

/** Sets the document title to "<page> · Kinnim Illuminated" (or just the site name). */
export function useDocumentTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} · ${SITE}` : SITE;
  }, [page]);
}
