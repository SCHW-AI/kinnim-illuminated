import { Navigator } from './Navigator';
import { useDocumentTitle } from './useDocumentTitle';

/** The title, a short introduction and the list of mishnayos. */
export function HomePage() {
  useDocumentTitle();
  return (
    <>
      <header className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
        <p lang="he" dir="rtl" className="text-3xl text-gold-deep sm:text-4xl dark:text-gold">
          מַסֶּכֶת קִנִּים
        </p>
        <h1 className="mt-2 text-4xl tracking-wide text-ink [font-variant:small-caps] sm:text-5xl">
          Maseches Kinnim
        </h1>
        <div className="kn-rule mx-auto my-5" aria-hidden="true" />
        <p className="text-lg leading-relaxed text-ink-soft">
          Kinnim deals with the pairs of birds brought as offerings, one a <em>chatas</em> and one
          an <em>olah</em>, and with what may still be offered once they are mixed up. Each
          illustrated mishnah plays out its cases step by step, so you can watch the birds move and
          see the ruling take shape.
        </p>
      </header>
      <Navigator />
    </>
  );
}
