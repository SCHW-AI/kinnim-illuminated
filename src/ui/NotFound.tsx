import { Link } from 'react-router';
import { useDocumentTitle } from './useDocumentTitle';

/** The in-app page for an unknown mishnah, case or address. */
export function NotFound() {
  useDocumentTitle('Not found');
  return (
    <section className="mx-auto max-w-xl py-12 text-center">
      <p className="text-4xl text-gold-deep dark:text-gold" aria-hidden="true">
        ❦
      </p>
      <h1 className="mt-4 text-3xl text-ink">This page is not in the book</h1>
      <p className="mt-3 text-ink-soft">
        There is no mishnah or case at this address. It may have been mistyped, or it may not exist
        yet.
      </p>
      <p className="mt-8">
        <Link to="/" className="kn-button kn-button-primary">
          Back to all mishnayos
        </Link>
      </p>
    </section>
  );
}
